/**
 * scripts/feed/sources/bundesagentur.mjs
 * Ingestion module for Bundesagentur für Arbeit Jobsuche API (Germany).
 * Public, official government API for job vacancies across Germany.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const API_URL = 'https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/app/jobs?was=Softwareentwickler&wo=Deutschland&size=20';

export async function fetchBundesagenturJobs() {
  const startTime = Date.now();
  console.log('\nFetching jobs from Bundesagentur für Arbeit (Germany Public API)...');
  const jobs = [];

  try {
    const res = await safeFetch(API_URL, {
      headers: {
        'X-API-Key': 'jobboerse-2017',
        'Accept': 'application/json',
      },
      timeoutMs: 12000,
    });

    if (!res.ok) {
      console.warn(`  [Bundesagentur] HTTP error: ${res.status} ${res.error}`);
      return {
        jobs: [],
        health: {
          id: 'bundesagentur-jobsuche',
          name: 'Bundesagentur für Arbeit Jobsuche API',
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
    const stellenangebote = data.stellenangebote || [];

    for (const item of stellenangebote) {
      const normalized = normalizeJobItem(
        {
          title: item.beruf || item.titel,
          company: item.arbeitgeber || 'Deutsches Unternehmen',
          location: item.arbeitsort?.ort || 'Deutschland',
          city: item.arbeitsort?.ort || 'Berlin',
          country: 'germany',
          description: `${item.beruf} in ${item.arbeitsort?.ort || 'Deutschland'}. Offizielle Veröffentlichung der Bundesagentur für Arbeit.`,
          applyUrl: item.externeUrl || `https://www.arbeitsagentur.de/jobsuche/jobdetail/${item.refnr}`,
          postedDate: item.aktuelleVeroeffentlichungsdatum ? item.aktuelleVeroeffentlichungsdatum.split('T')[0] : undefined,
          language: 'de',
        },
        'Bundesagentur für Arbeit'
      );

      if (normalized) jobs.push(normalized);
    }

    console.log(`  ✓ [Bundesagentur] Ingested ${jobs.length} official German employment vacancies`);

    return {
      jobs,
      health: {
        id: 'bundesagentur-jobsuche',
        name: 'Bundesagentur für Arbeit Jobsuche API',
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
    console.warn(`  [Bundesagentur] Error: ${err.message}`);
    return {
      jobs: [],
      health: {
        id: 'bundesagentur-jobsuche',
        name: 'Bundesagentur für Arbeit Jobsuche API',
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
