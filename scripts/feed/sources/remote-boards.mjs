/**
 * scripts/feed/sources/remote-boards.mjs
 * Ingestion module for remote-first boards with public feeds/APIs:
 * - Remotive (JSON API)
 * - Himalayas (JSON API)
 * - We Work Remotely (RSS feed)
 *
 * Filter rule: Keep ONLY roles where the location restriction includes
 * Europe, the EU, the EEA, or a specific European country.
 */

import { safeFetch } from '../lib/http.mjs';
import { parseFeedXml } from '../lib/rss-parser.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const EU_LOCATION_KEYWORDS = [
  'europe',
  'eu',
  'eea',
  'emea',
  'germany',
  'france',
  'united kingdom',
  'uk',
  'netherlands',
  'spain',
  'italy',
  'ireland',
  'sweden',
  'denmark',
  'norway',
  'finland',
  'poland',
  'austria',
  'switzerland',
  'portugal',
  'belgium',
  'anywhere',
  'worldwide',
];

function isEuropeLocation(locString = '') {
  const lower = locString.toLowerCase();
  return EU_LOCATION_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function fetchRemoteBoards() {
  const jobs = [];
  const healthList = [];

  console.log('\nFetching European roles from remote-first boards (Remotive, Himalayas, WWR)...');

  // 1. Remotive API
  const remotiveStart = Date.now();
  try {
    const res = await safeFetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=40', { timeoutMs: 12000 });
    if (res.ok) {
      const data = JSON.parse(res.data);
      const rawJobs = data.jobs || [];
      let remotiveCount = 0;

      for (const item of rawJobs) {
        if (!isEuropeLocation(item.candidate_required_location)) continue;

        const normalized = normalizeJobItem(
          {
            title: item.title,
            company: item.company_name,
            location: item.candidate_required_location || 'Europe (Remote)',
            city: 'Remote EU',
            country: 'EU',
            description: item.description,
            applyUrl: item.url,
            remote: true,
            postedDate: item.publication_date ? item.publication_date.split('T')[0] : undefined,
            salary: item.salary
              ? {
                  amount: item.salary,
                  currency: 'EUR',
                  period: 'Annual',
                }
              : undefined,
          },
          'Remotive'
        );

        if (normalized) {
          jobs.push(normalized);
          remotiveCount++;
        }
      }

      console.log(`  ✓ [Remotive] Ingested ${remotiveCount} European remote roles`);
      healthList.push({
        id: 'remotive',
        name: 'Remotive European Remote Jobs',
        type: 'jobs',
        feedType: 'json-api',
        status: remotiveCount > 0 ? 'active' : 'disabled-failed',
        httpStatus: res.status,
        itemsCount: remotiveCount,
        durationMs: Date.now() - remotiveStart,
        lastSuccess: remotiveCount > 0 ? new Date().toISOString() : undefined,
      });
    } else {
      healthList.push({
        id: 'remotive',
        name: 'Remotive European Remote Jobs',
        type: 'jobs',
        feedType: 'json-api',
        status: 'disabled-failed',
        httpStatus: res.status,
        error: res.error,
        itemsCount: 0,
        durationMs: Date.now() - remotiveStart,
      });
    }
  } catch (err) {
    console.warn(`  [Remotive] Error: ${err.message}`);
    healthList.push({
      id: 'remotive',
      name: 'Remotive European Remote Jobs',
      type: 'jobs',
      feedType: 'json-api',
      status: 'disabled-failed',
      httpStatus: 0,
      error: err.message,
      itemsCount: 0,
      durationMs: Date.now() - remotiveStart,
    });
  }

  // 2. Himalayas API
  const himalayasStart = Date.now();
  try {
    const res = await safeFetch('https://himalayas.app/jobs/api?limit=40', { timeoutMs: 12000 });
    if (res.ok) {
      const data = JSON.parse(res.data);
      const rawJobs = data.jobs || [];
      let himalayasCount = 0;

      for (const item of rawJobs) {
        const locRestrictions = (item.locationRestrictions || []).join(' ') + ' ' + (item.timezoneRestrictions || []).join(' ');
        if (!isEuropeLocation(locRestrictions) && !isEuropeLocation(item.title)) continue;

        const normalized = normalizeJobItem(
          {
            title: item.title,
            company: item.companyName,
            location: locRestrictions || 'Europe (Remote)',
            city: 'Remote EU',
            country: 'EU',
            description: item.excerpt || item.description,
            applyUrl: item.applicationUrl || `https://himalayas.app/companies/${item.companySlug}/jobs/${item.slug}`,
            remote: true,
            postedDate: item.pubDate ? new Date(item.pubDate * 1000).toISOString().split('T')[0] : undefined,
            salary: item.minSalary
              ? {
                  amount: item.minSalary,
                  currency: item.currency || 'USD',
                  period: 'Annual',
                }
              : undefined,
          },
          'Himalayas'
        );

        if (normalized) {
          jobs.push(normalized);
          himalayasCount++;
        }
      }

      console.log(`  ✓ [Himalayas] Ingested ${himalayasCount} European remote roles`);
      healthList.push({
        id: 'himalayas',
        name: 'Himalayas Remote Jobs API',
        type: 'jobs',
        feedType: 'json-api',
        status: himalayasCount > 0 ? 'active' : 'disabled-failed',
        httpStatus: res.status,
        itemsCount: himalayasCount,
        durationMs: Date.now() - himalayasStart,
        lastSuccess: himalayasCount > 0 ? new Date().toISOString() : undefined,
      });
    } else {
      healthList.push({
        id: 'himalayas',
        name: 'Himalayas Remote Jobs API',
        type: 'jobs',
        feedType: 'json-api',
        status: 'disabled-failed',
        httpStatus: res.status,
        error: res.error,
        itemsCount: 0,
        durationMs: Date.now() - himalayasStart,
      });
    }
  } catch (err) {
    console.warn(`  [Himalayas] Error: ${err.message}`);
    healthList.push({
      id: 'himalayas',
      name: 'Himalayas Remote Jobs API',
      type: 'jobs',
      feedType: 'json-api',
      status: 'disabled-failed',
      httpStatus: 0,
      error: err.message,
      itemsCount: 0,
      durationMs: Date.now() - himalayasStart,
    });
  }

  // 3. We Work Remotely RSS
  const wwrStart = Date.now();
  try {
    const res = await safeFetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', { timeoutMs: 12000 });
    if (res.ok) {
      const parsedXml = parseFeedXml(res.data);
      let wwrCount = 0;

      for (const item of parsedXml) {
        if (!isEuropeLocation(item.description) && !isEuropeLocation(item.title)) continue;

        const normalized = normalizeJobItem(
          {
            title: item.title,
            company: item.title.includes(':') ? item.title.split(':')[0] : 'Tech Innovator',
            location: 'Europe (Remote)',
            city: 'Remote EU',
            country: 'EU',
            description: item.excerpt,
            applyUrl: item.link,
            remote: true,
            postedDate: item.pubDate ? item.pubDate.toISOString().split('T')[0] : undefined,
          },
          'We Work Remotely'
        );

        if (normalized) {
          jobs.push(normalized);
          wwrCount++;
        }
      }

      console.log(`  ✓ [We Work Remotely] Ingested ${wwrCount} European remote roles`);
      healthList.push({
        id: 'weworkremotely',
        name: 'We Work Remotely Tech Feed',
        type: 'jobs',
        feedType: 'rss',
        status: wwrCount > 0 ? 'active' : 'disabled-failed',
        httpStatus: res.status,
        itemsCount: wwrCount,
        durationMs: Date.now() - wwrStart,
        lastSuccess: wwrCount > 0 ? new Date().toISOString() : undefined,
      });
    } else {
      healthList.push({
        id: 'weworkremotely',
        name: 'We Work Remotely Tech Feed',
        type: 'jobs',
        feedType: 'rss',
        status: 'disabled-failed',
        httpStatus: res.status,
        error: res.error,
        itemsCount: 0,
        durationMs: Date.now() - wwrStart,
      });
    }
  } catch (err) {
    console.warn(`  [We Work Remotely] Error: ${err.message}`);
    healthList.push({
      id: 'weworkremotely',
      name: 'We Work Remotely Tech Feed',
      type: 'jobs',
      feedType: 'rss',
      status: 'disabled-failed',
      httpStatus: 0,
      error: err.message,
      itemsCount: 0,
      durationMs: Date.now() - wwrStart,
    });
  }

  return { jobs, health: healthList };
}
