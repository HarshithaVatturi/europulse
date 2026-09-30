/**
 * scripts/feed/lib/dedupe.mjs
 * Deduplication and retention logic for EuroPulse feeds.
 *
 * Rules:
 * - News retention: 14 days for live feed.
 * - Job retention: 45 days maximum.
 * - Deduplicate jobs by normalized company + title + city + country.
 * - Keep richest record, record alternate sources in alsoSeenOn.
 */

const MAX_NEWS_DAYS = 14;
const MAX_JOB_DAYS = 45;

export function dedupeAndFilterJobs(existingJobs = [], incomingJobs = []) {
  const allJobs = [...incomingJobs, ...existingJobs];
  const now = new Date().getTime();
  const maxJobAgeMs = MAX_JOB_DAYS * 24 * 60 * 60 * 1000;

  const dedupedMap = new Map();

  for (const job of allJobs) {
    if (!job || !job.applyUrl || !job.title) continue;

    // Check age limit
    const postTime = new Date(job.postedDate).getTime();
    if (!isNaN(postTime) && now - postTime > maxJobAgeMs) {
      continue;
    }

    // Deduplication signature: normalized company + title + city + country
    const key = `${(job.company || '').toLowerCase()}|${(job.title || '').toLowerCase().replace(/[^\w]/g, '')}|${(job.city || '').toLowerCase()}|${(job.country || '').toLowerCase()}`;

    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, { ...job, alsoSeenOn: [...(job.alsoSeenOn || [])] });
    } else {
      const existing = dedupedMap.get(key);
      const isIncomingRicher = (job.skills?.length || 0) > (existing.skills?.length || 0) || (Boolean(job.salary) && !existing.salary);

      const combinedSources = new Set([...(existing.alsoSeenOn || []), ...(job.alsoSeenOn || [])]);
      if (job.source && job.source !== existing.source) {
        combinedSources.add(job.source);
      }
      if (existing.source && existing.source !== job.source) {
        combinedSources.add(existing.source);
      }

      if (isIncomingRicher) {
        dedupedMap.set(key, {
          ...job,
          alsoSeenOn: Array.from(combinedSources).filter((s) => s !== job.source),
        });
      } else {
        existing.alsoSeenOn = Array.from(combinedSources).filter((s) => s !== existing.source);
      }
    }
  }

  const sortedJobs = Array.from(dedupedMap.values()).sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

  const seenIds = new Set();
  const uniqueJobs = [];
  for (const job of sortedJobs) {
    let id = job.id;
    let counter = 1;
    while (seenIds.has(id)) {
      id = `${job.id}-${counter++}`;
    }
    seenIds.add(id);
    uniqueJobs.push({
      ...job,
      id,
      slug: id,
    });
  }

  return uniqueJobs;
}

export function dedupeAndFilterNews(existingNews = [], incomingNews = []) {
  const allNews = [...incomingNews, ...existingNews];
  const now = new Date().getTime();
  const maxNewsAgeMs = MAX_NEWS_DAYS * 24 * 60 * 60 * 1000;

  const seenIds = new Set();
  const seenUrls = new Set();
  const result = [];

  for (const item of allNews) {
    if (!item || !item.title) continue;

    // Filter news older than 14 days
    const itemTime = new Date(item.date).getTime();
    if (!isNaN(itemTime) && now - itemTime > maxNewsAgeMs) {
      continue;
    }

    const normUrl = item.source?.url ? item.source.url.toLowerCase().split('?')[0] : '';
    const normTitle = item.title.toLowerCase().replace(/[^\w]/g, '');

    if (seenIds.has(item.id) || seenIds.has(normTitle) || (normUrl && seenUrls.has(normUrl))) {
      continue;
    }

    seenIds.add(item.id);
    seenIds.add(normTitle);
    if (normUrl) seenUrls.add(normUrl);

    result.push(item);
  }

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
