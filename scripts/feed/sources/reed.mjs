/**
 * scripts/feed/sources/reed.mjs
 * Ingestion module for Reed.co.uk API.
 * Reads credentials from GitHub Actions secret: REED_API_KEY.
 * If missing, skips gracefully with a clear log line.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const REED_KEY = process.env.REED_API_KEY;

export async function fetchReedJobs() {
  const startTime = Date.now();

  if (!REED_KEY) {
    console.log('  [Reed] Missing secret REED_API_KEY. Source skipped gracefully.');
    return {
      jobs: [],
      health: {
        id: 'reed-uk',
        name: 'Reed.co.uk API',
        type: 'jobs',
        feedType: 'json-api',
        status: 'skipped-missing-key',
        httpStatus: 0,
        itemsCount: 0,
        durationMs: 0,
        error: 'Missing required secret: REED_API_KEY',
      },
    };
  }

  console.log('\nFetching jobs from Reed.co.uk API...');
  const jobs = [];
  const authHeader = 'Basic ' + Buffer.from(`${REED_KEY}:`).toString('base64');
  const url = 'https://www.reed.co.uk/api/1.0/search?keywords=engineer&resultsToTake=25';

  try {
    const res = await safeFetch(url, {
      headers: { Authorization: authHeader },
      timeoutMs: 10000,
    });

    if (!res.ok) {
      console.warn(`  [Reed] Request failed: HTTP ${res.status}`);
      return {
        jobs: [],
        health: {
          id: 'reed-uk',
          name: 'Reed.co.uk API',
          type: 'jobs',
          feedType: 'json-api',
          status: 'disabled-failed',
          httpStatus: res.status,
          error: res.error,
          itemsCount: 0,
          durationMs: Date.now() - startTime,
        },
      };
    }

    const data = JSON.parse(res.data);
    const results = data.results || [];

    for (const item of results) {
      const normalized = normalizeJobItem(
        {
          title: item.jobTitle,
          company: item.employerName,
          location: item.locationName,
          city: item.locationName,
          country: 'gb',
          description: item.jobDescription,
          applyUrl: item.jobUrl,
          postedDate: item.date ? item.date.split('/').reverse().join('-') : undefined,
          salary: item.minimumSalary
            ? {
                amount: Math.round(item.minimumSalary),
                currency: 'GBP',
                period: 'Annual',
              }
            : undefined,
        },
        'Reed UK Careers'
      );

      if (normalized) jobs.push(normalized);
    }

    console.log(`  ✓ [Reed] Ingested ${jobs.length} UK/European postings`);

    return {
      jobs,
      health: {
        id: 'reed-uk',
        name: 'Reed.co.uk API',
        type: 'jobs',
        feedType: 'json-api',
        status: jobs.length > 0 ? 'active' : 'disabled-failed',
        httpStatus: res.status,
        itemsCount: jobs.length,
        durationMs: Date.now() - startTime,
        lastSuccess: jobs.length > 0 ? new Date().toISOString() : undefined,
      },
    };
  } catch (err) {
    console.warn(`  [Reed] Error: ${err.message}`);
    return {
      jobs: [],
      health: {
        id: 'reed-uk',
        name: 'Reed.co.uk API',
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
