/**
 * scripts/feed/sources/rss-sources.mjs
 * Fetches and parses all active RSS/Atom news and official feeds.
 * Validates feeds at runtime (HTTP 200, parseable, at least 1 item).
 * Concurrency is capped to avoid overloading networks.
 */

import { safeFetch } from '../lib/http.mjs';
import { parseFeedXml } from '../lib/rss-parser.mjs';
import { normalizeNewsItem } from '../lib/normalize-news.mjs';

const CONCURRENCY_LIMIT = 5;

async function mapConcurrent(items, limit, fn) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

export async function fetchRssSources(sources) {
  const allArticles = [];
  const sourceHealth = [];

  console.log(`\nFetching ${sources.length} active European news and official RSS feeds...`);

  const fetchSource = async (source) => {
    const startTime = Date.now();
    try {
      const res = await safeFetch(source.url, { timeoutMs: 12000 });

      if (!res.ok) {
        console.warn(`  [${source.id}] Failed HTTP ${res.status}: ${res.error}`);
        return {
          id: source.id,
          name: source.name,
          type: source.type,
          feedType: source.feedType,
          status: 'disabled-failed',
          httpStatus: res.status,
          error: res.error,
          itemsCount: 0,
          durationMs: Date.now() - startTime,
        };
      }

      const rawItems = parseFeedXml(res.data);
      if (rawItems.length === 0) {
        console.warn(`  [${source.id}] 0 items parsed from feed.`);
        return {
          id: source.id,
          name: source.name,
          type: source.type,
          feedType: source.feedType,
          status: 'disabled-failed',
          httpStatus: res.status,
          error: '0 items parsed from XML',
          itemsCount: 0,
          durationMs: Date.now() - startTime,
        };
      }

      let validCount = 0;
      for (const raw of rawItems) {
        const normalized = normalizeNewsItem(raw, source);
        if (normalized) {
          allArticles.push(normalized);
          validCount++;
        }
      }

      console.log(`  ✓ [${source.id}] Ingested ${validCount}/${rawItems.length} items (${source.language.toUpperCase()})`);

      return {
        id: source.id,
        name: source.name,
        type: source.type,
        feedType: source.feedType,
        status: 'active',
        httpStatus: res.status,
        itemsCount: validCount,
        durationMs: Date.now() - startTime,
        lastSuccess: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`  [${source.id}] Exception: ${err.message}`);
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        feedType: source.feedType,
        status: 'disabled-failed',
        httpStatus: 0,
        error: err.message,
        itemsCount: 0,
        durationMs: Date.now() - startTime,
      };
    }
  };

  const healthResults = await mapConcurrent(sources, CONCURRENCY_LIMIT, fetchSource);
  sourceHealth.push(...healthResults);

  return { articles: allArticles, health: sourceHealth };
}
