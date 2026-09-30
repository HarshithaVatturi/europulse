/**
 * scripts/feed/lib/http.mjs
 * Resilient HTTP client with User-Agent, timeout, retries, ETag/If-Modified-Since, and rate limiting.
 */

import fs from 'node:fs';
import path from 'node:path';

const USER_AGENT = 'EuroPulseBot/1.0 (+https://europulse.github.io)';
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const CACHE_FILE = path.resolve(process.cwd(), 'src/data/_health/http-cache.json');

// In-memory or file-based conditional request cache
let httpCache = {};
try {
  if (fs.existsSync(CACHE_FILE)) {
    httpCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
} catch {
  httpCache = {};
}

export function saveHttpCache() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(httpCache, null, 2), 'utf-8');
  } catch {
    // Non-critical cache save
  }
}

/**
 * Fetch a URL with safety, timeout, User-Agent, conditional headers, and backoff.
 * Returns: { ok: boolean, status: number, data?: string, notModified?: boolean, error?: string }
 */
export async function safeFetch(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers = {},
    useConditional = true,
    retries = MAX_RETRIES,
  } = options;

  const reqHeaders = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, application/json, text/xml, text/html, */*',
    ...headers,
  };

  // Add conditional headers if cached
  if (useConditional && httpCache[url]) {
    if (httpCache[url].etag) {
      reqHeaders['If-None-Match'] = httpCache[url].etag;
    }
    if (httpCache[url].lastModified) {
      reqHeaders['If-Modified-Since'] = httpCache[url].lastModified;
    }
  }

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: reqHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 304) {
        return {
          ok: true,
          status: 304,
          notModified: true,
          data: httpCache[url]?.lastBody || '',
        };
      }

      if (response.ok) {
        const text = await response.text();
        const etag = response.headers.get('etag');
        const lastModified = response.headers.get('last-modified');

        if (useConditional && (etag || lastModified)) {
          httpCache[url] = {
            etag: etag || undefined,
            lastModified: lastModified || undefined,
            lastBody: text,
            updatedAt: new Date().toISOString(),
          };
        }

        return {
          ok: true,
          status: response.status,
          data: text,
        };
      }

      // Handle retryable status codes (429, 500, 502, 503, 504)
      if ([429, 500, 502, 503, 504].includes(response.status) && attempt < retries) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt < retries) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return {
        ok: false,
        status: 0,
        error: err.name === 'AbortError' ? 'Request timed out' : err.message,
      };
    }
  }

  return { ok: false, status: 0, error: 'Exceeded maximum retries' };
}
