/**
 * scripts/feed/sources/arbeitnow.mjs
 * Fetches European jobs from Arbeitnow's public European job board API.
 * Free, no key required, pages through results, preserves visa sponsorship flag.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const API_BASE = 'https://www.arbeitnow.com/api/job-board-api';
const MAX_PAGES = 3;

export async function fetchArbeitnowJobs() {
  const jobs = [];
  const startTime = Date.now();
  let totalFetched = 0;
  let lastStatus = 200;

  console.log('\nFetching jobs from Arbeitnow European Job API...');

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${API_BASE}?page=${page}`;
      const res = await safeFetch(url, { timeoutMs: 12000 });

      if (!res.ok) {
        lastStatus = res.status;
        console.warn(`  [arbeitnow] Page ${page} failed: ${res.error}`);
        break;
      }

      let data;
      try {
        data = JSON.parse(res.data);
      } catch (err) {
        console.warn(`  [arbeitnow] JSON parse failed on page ${page}: ${err.message}`);
        break;
      }

      const rawList = data.data || [];
      if (rawList.length === 0) break;

      for (const item of rawList) {
        totalFetched++;
        const normalized = normalizeJobItem(
          {
            title: item.title,
            company: item.company_name,
            location: item.location,
            country: item.location?.toLowerCase().includes('berlin') || item.location?.toLowerCase().includes('germany') ? 'germany' : 'EU',
            city: item.location,
            tags: item.tags,
            description: item.description,
            applyUrl: item.url,
            remote: Boolean(item.remote),
            visaSponsorship: Boolean(item.visa_sponsorship),
            postedDate: new Date(item.created_at * 1000).toISOString().split('T')[0],
          },
          'Arbeitnow European Career Feed'
        );

        if (normalized) {
          jobs.push(normalized);
        }
      }

      if (!data.links?.next) break;
    }

    console.log(`  ✓ [arbeitnow] Normalized ${jobs.length}/${totalFetched} European jobs`);

    return {
      jobs,
      health: {
        id: 'arbeitnow',
        name: 'Arbeitnow Jobs API',
        type: 'jobs',
        feedType: 'json-api',
        status: jobs.length > 0 ? 'active' : 'disabled-failed',
        httpStatus: lastStatus,
        itemsCount: jobs.length,
        durationMs: Date.now() - startTime,
        lastSuccess: jobs.length > 0 ? new Date().toISOString() : undefined,
      },
    };
  } catch (err) {
    console.warn(`  [arbeitnow] Exception: ${err.message}`);
    return {
      jobs: [],
      health: {
        id: 'arbeitnow',
        name: 'Arbeitnow Jobs API',
        type: 'jobs',
        feedType: 'json-api',
        status: 'disabled-failed',
        httpStatus: 0,
        error: err.message,
        itemsCount: 0,
        durationMs: Date.now() - startTime,
      },
    };
  }
}
