/**
 * scripts/feed/index.mjs
 * EuroPulse Master Live Feed Ingestion Orchestrator.
 *
 * Runs scheduled feed ingestion across all verified European news and job sources:
 * - News RSS/Atom feeds (Pan-European, Broadcasters, Startups, Industry Verticals, Careers)
 * - Job APIs (Arbeitnow, Adzuna, Bundesagentur, France Travail, Reed, Jooble, Remote boards, ATS)
 * - Strict schema validation with Zod (invalid items dropped & counted)
 * - Deduplication and retention (News: 14 days; Jobs: 45 days)
 * - Source health report written to src/data/_health/feed-status.json
 * - Non-destructive: missing secrets are safely logged and skipped, build never fails.
 *
 * Usage: node --experimental-strip-types scripts/feed/index.mjs [--write]
 */

import fs from 'node:fs';
import path from 'node:path';
import { feedSources } from '../../src/config/sources.ts';
import { saveHttpCache } from './lib/http.mjs';
import { dedupeAndFilterNews, dedupeAndFilterJobs } from './lib/dedupe.mjs';
import { fetchRssSources } from './sources/rss-sources.mjs';
import { fetchArbeitnowJobs } from './sources/arbeitnow.mjs';
import { fetchAdzunaJobs } from './sources/adzuna.mjs';
import { fetchBundesagenturJobs } from './sources/bundesagentur.mjs';
import { fetchFranceTravailJobs } from './sources/france-travail.mjs';
import { fetchReedJobs } from './sources/reed.mjs';
import { fetchJoobleJobs } from './sources/jooble.mjs';
import { fetchRemoteBoards } from './sources/remote-boards.mjs';
import { fetchAtsJobs } from './sources/ats.mjs';

const writeToFile = process.argv.includes('--write');

const newsFilePath = path.resolve(process.cwd(), 'src/data/news.json');
const jobsFilePath = path.resolve(process.cwd(), 'src/data/jobs.json');
const healthFilePath = path.resolve(process.cwd(), 'src/data/_health/feed-status.json');
const statsFilePath = path.resolve(process.cwd(), 'src/data/sync-stats.json');

function loadJson(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {
    // fallback
  }
  return fallback;
}

async function main() {
  const startTime = Date.now();
  console.log('========================================================');
  console.log('  EuroPulse: Live Feed Autonomous Refresh Pipeline      ');
  console.log('========================================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${writeToFile ? 'PRODUCTION WRITE (--write)' : 'DRY RUN (no disk write)'}`);

  // 1. Separate news RSS sources and link-out sources
  const activeRssSources = feedSources.filter(
    (s) => (s.type === 'news' || s.type === 'official') && s.enabled && s.feedType !== 'link-out'
  );
  const linkOutSources = feedSources.filter((s) => s.feedType === 'link-out');

  console.log(`Configured Sources: ${feedSources.length} total (${activeRssSources.length} RSS feeds, ${linkOutSources.length} link-out portals)`);

  // 2. Fetch News RSS feeds
  const { articles: incomingNews, health: newsHealth } = await fetchRssSources(activeRssSources);

  // 3. Fetch Job APIs
  const incomingJobs = [];
  const jobsHealth = [];

  // 3.1 Arbeitnow (free, public)
  const arbeitnowRes = await fetchArbeitnowJobs();
  incomingJobs.push(...arbeitnowRes.jobs);
  jobsHealth.push(arbeitnowRes.health);

  // 3.2 Adzuna API
  const adzunaRes = await fetchAdzunaJobs();
  incomingJobs.push(...adzunaRes.jobs);
  jobsHealth.push(adzunaRes.health);

  // 3.3 Bundesagentur für Arbeit (public API)
  const baRes = await fetchBundesagenturJobs();
  incomingJobs.push(...baRes.jobs);
  jobsHealth.push(baRes.health);

  // 3.4 France Travail API
  const ftRes = await fetchFranceTravailJobs();
  incomingJobs.push(...ftRes.jobs);
  jobsHealth.push(ftRes.health);

  // 3.5 Reed API
  const reedRes = await fetchReedJobs();
  incomingJobs.push(...reedRes.jobs);
  jobsHealth.push(reedRes.health);

  // 3.6 Jooble API
  const joobleRes = await fetchJoobleJobs();
  incomingJobs.push(...joobleRes.jobs);
  jobsHealth.push(joobleRes.health);

  // 3.7 Remote boards (Remotive, Himalayas, WWR)
  const remoteRes = await fetchRemoteBoards();
  incomingJobs.push(...remoteRes.jobs);
  jobsHealth.push(...remoteRes.health);

  // 3.8 Direct employer ATS feeds
  const atsRes = await fetchAtsJobs();
  incomingJobs.push(...atsRes.jobs);
  jobsHealth.push(atsRes.health);

  // Add link-out sources to health registry as 'link-out'
  const linkOutHealth = linkOutSources.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    feedType: s.feedType,
    status: 'link-out',
    httpStatus: 200,
    itemsCount: 0,
    durationMs: 0,
    lastSuccess: new Date().toISOString(),
  }));

  const allHealth = [...newsHealth, ...jobsHealth, ...linkOutHealth];

  // 4. Deduplicate and apply retention policies
  console.log('\nApplying Deduplication and Retention Rules...');
  const existingNews = loadJson(newsFilePath, []);
  const existingJobs = loadJson(jobsFilePath, []);

  const mergedNews = dedupeAndFilterNews(existingNews, incomingNews);
  const mergedJobs = dedupeAndFilterJobs(existingJobs, incomingJobs);

  console.log(`News: ${existingNews.length} existing + ${incomingNews.length} incoming -> ${mergedNews.length} retained (<= 14 days)`);
  console.log(`Jobs: ${existingJobs.length} existing + ${incomingJobs.length} incoming -> ${mergedJobs.length} retained (<= 45 days)`);

  // 5. Health Status Summary
  const activeCount = allHealth.filter((h) => h.status === 'active').length;
  const skippedCount = allHealth.filter((h) => h.status === 'skipped-missing-key').length;
  const failedCount = allHealth.filter((h) => h.status === 'disabled-failed').length;
  const linkOutCount = allHealth.filter((h) => h.status === 'link-out').length;

  const healthPayload = {
    lastUpdated: new Date().toISOString(),
    totalSources: allHealth.length,
    activeSources: activeCount,
    skippedSources: skippedCount,
    failedSources: failedCount,
    linkOutSources: linkOutCount,
    totalNewsItems: mergedNews.length,
    totalJobPostings: mergedJobs.length,
    durationSeconds: Math.round((Date.now() - startTime) / 1000),
    sources: allHealth,
  };

  // 6. Write to disk if --write enabled
  if (writeToFile) {
    const healthDir = path.dirname(healthFilePath);
    if (!fs.existsSync(healthDir)) fs.mkdirSync(healthDir, { recursive: true });

    fs.writeFileSync(newsFilePath, JSON.stringify(mergedNews, null, 2), 'utf-8');
    fs.writeFileSync(jobsFilePath, JSON.stringify(mergedJobs, null, 2), 'utf-8');
    fs.writeFileSync(healthFilePath, JSON.stringify(healthPayload, null, 2), 'utf-8');
    saveHttpCache();

    // Update telemetry in sync-stats.json
    try {
      const stats = loadJson(statsFilePath, {
        lastSyncDate: new Date().toISOString().split('T')[0],
        todaySyncCount: 1,
        totalSyncCount: 1,
      });
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastSyncDate === today) {
        stats.todaySyncCount = (stats.todaySyncCount || 0) + 1;
      } else {
        stats.lastSyncDate = today;
        stats.todaySyncCount = 1;
      }
      stats.totalSyncCount = (stats.totalSyncCount || 0) + 1;
      stats.lastRunAt = new Date().toISOString();
      fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf-8');
    } catch {
      // Non-critical telemetry
    }

    // Trigger daily pulse generation if new news exists
    try {
      const { execSync } = await import('node:child_process');
      execSync('node scripts/generate-pulse.mjs --write', { stdio: 'inherit' });
    } catch (e) {
      console.warn('Note: generate-pulse notice:', e.message);
    }

    console.log('\n✓ Successfully updated data files and health report!');
  } else {
    console.log('\n[Dry Run Complete] Run with --write to commit data to disk.');
  }

  console.log(`\nPipeline completed in ${Math.round((Date.now() - startTime) / 1000)}s.`);
  console.log(`Active: ${activeCount} | Skipped: ${skippedCount} | Failed: ${failedCount} | Link-Out: ${linkOutCount}`);
}

main().catch((err) => {
  console.error('Fatal feed error:', err);
  process.exit(1);
});
