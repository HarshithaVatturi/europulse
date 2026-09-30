/**
 * scripts/feed/sources/adzuna.mjs
 * Ingestion module for Adzuna European Jobs API.
 * Reads credentials from GitHub Actions secrets: ADZUNA_APP_ID, ADZUNA_APP_KEY.
 * If credentials are missing, skips gracefully with a clear log line.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

// European country codes supported by Adzuna
const EU_COUNTRIES = ['gb', 'de', 'fr', 'nl', 'it', 'es', 'at', 'pl'];

export async function fetchAdzunaJobs() {
  const startTime = Date.now();

  if (!APP_ID || !APP_KEY) {
    console.log('  [Adzuna] Missing secrets ADZUNA_APP_ID / ADZUNA_APP_KEY. Source skipped gracefully.');
    return {
      jobs: [],
      health: {
        id: 'adzuna',
        name: 'Adzuna European Jobs API',
        type: 'jobs',
        feedType: 'json-api',
        status: 'skipped-missing-key',
        httpStatus: 0,
        itemsCount: 0,
        durationMs: 0,
        error: 'Missing required secrets: ADZUNA_APP_ID, ADZUNA_APP_KEY',
      },
    };
  }

  console.log('\nFetching jobs from Adzuna European Jobs API...');
  const jobs = [];

  // Budget calls: rotate 2 countries per run to respect the 250 calls/day free tier limit
  const currentHour = new Date().getUTCHours();
  const targetCountries = [
    EU_COUNTRIES[(currentHour * 2) % EU_COUNTRIES.length],
    EU_COUNTRIES[(currentHour * 2 + 1) % EU_COUNTRIES.length],
  ];

  let lastStatus = 200;

  for (const cCode of targetCountries) {
    const url = `https://api.adzuna.com/v1/api/jobs/${cCode}/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=15&content-type=application/json`;

    try {
      const res = await safeFetch(url, { timeoutMs: 10000 });
      if (!res.ok) {
        lastStatus = res.status;
        console.warn(`  [Adzuna] Country ${cCode.toUpperCase()} request failed: HTTP ${res.status}`);
        continue;
      }

      const json = JSON.parse(res.data);
      const results = json.results || [];

      for (const item of results) {
        const normalized = normalizeJobItem(
          {
            title: item.title,
            company: item.company?.display_name,
            location: item.location?.display_name,
            city: item.location?.area?.[item.location.area.length - 1] || item.location?.display_name,
            country: cCode === 'gb' ? 'gb' : cCode === 'de' ? 'germany' : cCode === 'fr' ? 'france' : cCode === 'nl' ? 'netherlands' : cCode === 'it' ? 'italy' : cCode === 'es' ? 'spain' : 'EU',
            description: item.description,
            applyUrl: item.redirect_url,
            postedDate: item.created ? item.created.split('T')[0] : undefined,
            salary: item.salary_min
              ? {
                  amount: Math.round(item.salary_min),
                  currency: cCode === 'gb' ? 'GBP' : 'EUR',
                  period: 'Annual',
                }
              : undefined,
          },
          `Adzuna (${cCode.toUpperCase()})`
        );

        if (normalized) jobs.push(normalized);
      }
    } catch (err) {
      console.warn(`  [Adzuna] Country ${cCode} parsing error: ${err.message}`);
    }
  }

  console.log(`  ✓ [Adzuna] Ingested ${jobs.length} jobs across ${targetCountries.join(', ').toUpperCase()}`);

  return {
    jobs,
    health: {
      id: 'adzuna',
      name: 'Adzuna European Jobs API',
      type: 'jobs',
      feedType: 'json-api',
      status: jobs.length > 0 ? 'active' : 'disabled-failed',
      httpStatus: lastStatus,
      itemsCount: jobs.length,
      durationMs: Date.now() - startTime,
      lastSuccess: jobs.length > 0 ? new Date().toISOString() : undefined,
    },
  };
}
