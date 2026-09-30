/**
 * scripts/feed/sources/ats.mjs
 * Ingestion module for public Applicant Tracking System (ATS) endpoints:
 * - Greenhouse Job Board API: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 * - Lever Postings API: https://api.lever.co/v0/postings/{token}
 * - SmartRecruiters Postings API: https://api.smartrecruiters.com/v1/companies/{token}/postings
 *
 * Connects directly to employer career feeds for companies in our taxonomy graph.
 */

import { safeFetch } from '../lib/http.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';
import { getActiveAtsCompanies } from '../../../src/config/ats-companies.ts';

export async function fetchAtsJobs() {
  const activeCompanies = getActiveAtsCompanies();
  console.log(`\nFetching live ATS jobs for ${activeCompanies.length} European employers with public boards...`);

  const jobs = [];
  let totalSuccessfulBoards = 0;
  const startTime = Date.now();

  for (const company of activeCompanies) {
    if (company.atsType === 'greenhouse') {
      const url = `https://boards-api.greenhouse.io/v1/boards/${company.boardToken}/jobs`;
      try {
        const res = await safeFetch(url, { timeoutMs: 10000 });
        if (res.ok) {
          const data = JSON.parse(res.data);
          const rawJobs = data.jobs || [];
          let count = 0;

          for (const item of rawJobs.slice(0, 15)) {
            const locName = item.location?.name || 'European Hub';
            const normalized = normalizeJobItem(
              {
                title: item.title,
                company: company.companySlug,
                location: locName,
                city: locName.split(',')[0].trim(),
                country: 'EU',
                applyUrl: item.absolute_url,
                postedDate: item.updated_at ? item.updated_at.split('T')[0] : undefined,
              },
              `${company.name} (Direct Careers)`
            );

            if (normalized) {
              jobs.push(normalized);
              count++;
            }
          }
          if (count > 0) totalSuccessfulBoards++;
        }
      } catch (err) {
        console.warn(`  [ATS Greenhouse] ${company.name} fetch failed: ${err.message}`);
      }
    } else if (company.atsType === 'lever') {
      const url = `https://api.lever.co/v0/postings/${company.boardToken}?mode=json`;
      try {
        const res = await safeFetch(url, { timeoutMs: 10000 });
        if (res.ok) {
          const rawJobs = JSON.parse(res.data);
          let count = 0;

          for (const item of (Array.isArray(rawJobs) ? rawJobs : []).slice(0, 15)) {
            const loc = item.categories?.location || 'Europe';
            const normalized = normalizeJobItem(
              {
                title: item.text,
                company: company.companySlug,
                location: loc,
                city: loc.split(',')[0].trim(),
                country: 'EU',
                description: item.descriptionPlain,
                applyUrl: item.hostedUrl || item.applyUrl,
                postedDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : undefined,
              },
              `${company.name} (Direct Careers)`
            );

            if (normalized) {
              jobs.push(normalized);
              count++;
            }
          }
          if (count > 0) totalSuccessfulBoards++;
        }
      } catch (err) {
        console.warn(`  [ATS Lever] ${company.name} fetch failed: ${err.message}`);
      }
    } else if (company.atsType === 'smartrecruiters') {
      const url = `https://api.smartrecruiters.com/v1/companies/${company.boardToken}/postings?limit=15`;
      try {
        const res = await safeFetch(url, { timeoutMs: 10000 });
        if (res.ok) {
          const data = JSON.parse(res.data);
          const rawJobs = data.content || [];
          let count = 0;

          for (const item of rawJobs) {
            const city = item.location?.city || 'European Hub';
            const country = item.location?.country || 'EU';
            const normalized = normalizeJobItem(
              {
                title: item.name,
                company: company.companySlug,
                location: `${city}, ${country}`,
                city,
                country: country.toLowerCase() === 'de' ? 'germany' : country.toLowerCase() === 'fr' ? 'france' : 'EU',
                applyUrl: `https://jobs.smartrecruiters.com/${company.boardToken}/${item.id}`,
                postedDate: item.releasedDate ? item.releasedDate.split('T')[0] : undefined,
              },
              `${company.name} (Direct Careers)`
            );

            if (normalized) {
              jobs.push(normalized);
              count++;
            }
          }
          if (count > 0) totalSuccessfulBoards++;
        }
      } catch (err) {
        console.warn(`  [ATS SmartRecruiters] ${company.name} fetch failed: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ [ATS] Ingested ${jobs.length} direct openings from ${totalSuccessfulBoards} European employer boards`);

  return {
    jobs,
    health: {
      id: 'ats-greenhouse-aggregate',
      name: 'Public ATS Job Boards (Greenhouse/Lever/SmartRecruiters)',
      type: 'jobs',
      feedType: 'ats-api',
      status: jobs.length > 0 ? 'active' : 'disabled-failed',
      httpStatus: 200,
      itemsCount: jobs.length,
      durationMs: Date.now() - startTime,
      lastSuccess: jobs.length > 0 ? new Date().toISOString() : undefined,
    },
  };
}
