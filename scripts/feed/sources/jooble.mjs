/**
 * scripts/feed/sources/jooble.mjs
 * Ingestion module for Jooble European Jobs API.
 * Reads credentials from GitHub Actions secret: JOOBLE_API_KEY.
 * If missing, skips gracefully with a clear log line.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const JOOBLE_KEY = process.env.JOOBLE_API_KEY;

export async function fetchJoobleJobs() {
  const startTime = Date.now();

  if (!JOOBLE_KEY) {
    console.log('  [Jooble] Missing secret JOOBLE_API_KEY. Source skipped gracefully.');
    return {
      jobs: [],
      health: {
        id: 'jooble',
        name: 'Jooble API',
        type: 'jobs',
        feedType: 'json-api',
        status: 'skipped-missing-key',
        httpStatus: 0,
        itemsCount: 0,
        durationMs: 0,
        error: 'Missing required secret: JOOBLE_API_KEY',
      },
    };
  }

  console.log('\nFetching jobs from Jooble API...');
  const jobs = [];
  const url = `https://jooble.org/api/${JOOBLE_KEY}`;

  try {
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: 'engineer technology',
        location: 'Europe',
        page: 1,
      }),
      timeoutMs: 10000,
    });

    if (!res.ok) {
      console.warn(`  [Jooble] Request failed: HTTP ${res.status}`);
      return {
        jobs: [],
        health: {
          id: 'jooble',
          name: 'Jooble API',
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
    const results = data.jobs || [];

    for (const item of results) {
      const normalized = normalizeJobItem(
        {
          title: item.title,
          company: item.company,
          location: item.location,
          city: item.location,
          country: 'EU',
          description: item.snippet,
          applyUrl: item.link,
          postedDate: item.updated ? item.updated.split('T')[0] : undefined,
          salary: item.salary
            ? {
                amount: item.salary,
                currency: 'EUR',
                period: 'Annual',
              }
            : undefined,
        },
        'Jooble Europe'
      );

      if (normalized) jobs.push(normalized);
    }

    console.log(`  ✓ [Jooble] Ingested ${jobs.length} European postings`);

    return {
      jobs,
      health: {
        id: 'jooble',
        name: 'Jooble API',
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
    console.warn(`  [Jooble] Error: ${err.message}`);
    return {
      jobs: [],
      health: {
        id: 'jooble',
        name: 'Jooble API',
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
