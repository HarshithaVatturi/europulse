/**
 * scripts/feed/sources/france-travail.mjs
 * Ingestion module for France Travail (Pôle Emploi) "Offres d'emploi" API.
 * Reads credentials from GitHub Actions secrets:
 * - FRANCE_TRAVAIL_CLIENT_ID
 * - FRANCE_TRAVAIL_CLIENT_SECRET
 *
 * If missing, skips gracefully with a clear log line.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';

const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

export async function fetchFranceTravailJobs() {
  const startTime = Date.now();

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log('  [France Travail] Missing secrets FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET. Source skipped gracefully.');
    return {
      jobs: [],
      health: {
        id: 'france-travail',
        name: 'France Travail "Offres d\'emploi" API',
        type: 'jobs',
        feedType: 'json-api',
        status: 'skipped-missing-key',
        httpStatus: 0,
        itemsCount: 0,
        durationMs: 0,
        error: 'Missing required secrets: FRANCE_TRAVAIL_CLIENT_ID, FRANCE_TRAVAIL_CLIENT_SECRET',
      },
    };
  }

  console.log('\nFetching jobs from France Travail Official API...');
  const jobs = [];

  try {
    // 1. Get OAuth2 Token
    const tokenUrl = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'api_offresdemploiv2 o2dsoffre',
    });

    const tokenRes = await safeFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
      timeoutMs: 8000,
    });

    if (!tokenRes.ok) {
      console.warn(`  [France Travail] Auth token request failed: HTTP ${tokenRes.status}`);
      return {
        jobs: [],
        health: {
          id: 'france-travail',
          name: 'France Travail "Offres d\'emploi" API',
          type: 'jobs',
          feedType: 'json-api',
          status: 'disabled-failed',
          httpStatus: tokenRes.status,
          error: `Auth failed: ${tokenRes.error}`,
          itemsCount: 0,
          durationMs: Date.now() - startTime,
        },
      };
    }

    const tokenData = JSON.parse(tokenRes.data);
    const accessToken = tokenData.access_token;

    // 2. Fetch Job Offers
    const searchUrl = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?motsCles=ingenieur%20informatique&range=0-24';
    const searchRes = await safeFetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      timeoutMs: 10000,
    });

    if (!searchRes.ok) {
      console.warn(`  [France Travail] Offers search failed: HTTP ${searchRes.status}`);
      return {
        jobs: [],
        health: {
          id: 'france-travail',
          name: 'France Travail "Offres d\'emploi" API',
          type: 'jobs',
          feedType: 'json-api',
          status: 'disabled-failed',
          httpStatus: searchRes.status,
          error: searchRes.error,
          itemsCount: 0,
          durationMs: Date.now() - startTime,
        },
      };
    }

    const searchData = JSON.parse(searchRes.data);
    const resultList = searchData.resultats || [];

    for (const item of resultList) {
      const normalized = normalizeJobItem(
        {
          title: item.intitule,
          company: item.entreprise?.nom || 'Entreprise Partenaire',
          location: item.lieuTravail?.libelle || 'France',
          city: item.lieuTravail?.libelle?.split(' - ')[1] || item.lieuTravail?.libelle || 'Paris',
          country: 'france',
          description: item.description,
          applyUrl: item.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${item.id}`,
          postedDate: item.dateCreation ? item.dateCreation.split('T')[0] : undefined,
          salary: item.salaire?.libelle
            ? {
                amount: item.salaire.libelle,
                currency: 'EUR',
                period: 'Annuel',
              }
            : undefined,
        },
        'France Travail'
      );

      if (normalized) jobs.push(normalized);
    }

    console.log(`  ✓ [France Travail] Ingested ${jobs.length} verified French employment openings`);

    return {
      jobs,
      health: {
        id: 'france-travail',
        name: 'France Travail "Offres d\'emploi" API',
        type: 'jobs',
        feedType: 'json-api',
        status: jobs.length > 0 ? 'active' : 'disabled-failed',
        httpStatus: searchRes.status,
        itemsCount: jobs.length,
        durationMs: Date.now() - startTime,
        lastSuccess: jobs.length > 0 ? new Date().toISOString() : undefined,
      },
    };
  } catch (err) {
    console.warn(`  [France Travail] Error: ${err.message}`);
    return {
      jobs: [],
      health: {
        id: 'france-travail',
        name: 'France Travail "Offres d\'emploi" API',
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
