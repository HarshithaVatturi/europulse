# EuroPulse — Full Bug Audit & Fix Report

**Audit Date:** 2026-09-30 (Europe/Paris)
**Build at audit start:** 562 pages, 0 errors
**Build at audit end:** 562 pages, 0 errors
**TypeScript at audit end:** 0 errors, 0 warnings, 4 hints (down from 194)

---

## Executive Summary

A full-spectrum audit was performed across build/tooling, GitHub Pages compatibility,
data integrity, TypeScript correctness, pipeline automation, accessibility, performance,
SEO, and privacy. **4 bugs were found and fixed.** No redesign was performed; all changes
are minimal, targeted, and build-verified.

---

## Bug Register

### BUG-01 — Workflow Name Misleads on Pipeline Frequency

| Field    | Detail                                                    |
|----------|-----------------------------------------------------------|
| File     | `.github/workflows/daily-pipeline.yml`                    |
| Severity | Low — cosmetic but operationally confusing                |
| Status   | Fixed                                                     |

**Problem:** The workflow was named `EuroPulse 10-Minute Autonomous Pipeline` and its
inline comment said `# Runs automatically every 10 minutes`, but the actual cron
expression was `*/30 * * * *` (every 30 minutes, 48 cycles/day). This discrepancy
causes confusion when reading GitHub Actions logs.

**Fix:** Renamed workflow to `EuroPulse 30-Minute Autonomous Pipeline` and corrected
the comment to `# Runs automatically every 30 minutes (48 cycles per day)`.

---

### BUG-02 — pulse.ts Double-Seeds 2026-09-29 and Hardcodes Stale Fallback Dates

| Field    | Detail                                                              |
|----------|---------------------------------------------------------------------|
| File     | `src/services/pulse.ts`                                             |
| Severity | Medium — silent stale-date fallback if glob discovery ever failed   |
| Status   | Fixed                                                               |

**Problem:** The service both manually imported `2026-09-29.json` as a `fallbackEdition`
AND used `import.meta.glob` to discover the same file dynamically. Three issues:

1. The `editions` map always had `2026-09-29` pre-seeded, regardless of glob results.
2. Fallback strings `|| '2026-09-29'` on two lines would silently return stale data if
   the glob returned nothing, rather than surfacing a clear error.
3. Duplicate `.sort().reverse()` logic spread across 3 functions.

**Fix:** Removed the manual import and static seed entry. `import.meta.glob` is now the
single source of truth. A shared `getSortedDates()` helper deduplicates the sort logic.
`getLatestPulseEdition()` now throws a clear `Error` if no pulse editions are found on
disk, rather than silently returning a 2026-09-29 edition.

---

### BUG-03 — Deprecated `z` Re-Export from `astro:content` (194 TypeScript Hints)

| Field    | Detail                                                              |
|----------|---------------------------------------------------------------------|
| File     | `src/content.config.ts`                                             |
| Severity | Low — no runtime impact; produced 194 ts(6385) hints in astro check |
| Status   | Fixed                                                               |

**Problem:** Astro v7 deprecated the `z` re-export from `astro:content`. Every schema
field in `content.config.ts` triggered a `ts(6385)` deprecation hint (194 total).

**Fix:** Changed the import to pull `z` directly from `zod`, which is already a
transitive dependency of Astro — no new package required.

```diff
- import { defineCollection, z } from 'astro:content';
+ import { defineCollection } from 'astro:content';
+ import { z } from 'zod';
```

---

### BUG-04 — Deprecated `React.FormEvent` Namespace Type

| Field    | Detail                                                              |
|----------|---------------------------------------------------------------------|
| File     | `src/components/islands/SearchResults.tsx`                          |
| Severity | Low — React 19 deprecates namespace-style type access               |
| Status   | Fixed                                                               |

**Problem:** `React.FormEvent` accessed via the `React` namespace is deprecated in
React 19. `astro check` flagged this as a `ts(6385)` hint. The type also lacked the
`<HTMLFormElement>` generic, reducing type safety.

**Fix:**
```diff
- const handleSearchSubmit = (e: React.FormEvent) => {
+ const handleSearchSubmit = (e: import('react').FormEvent<HTMLFormElement>) => {
```

---

## Items Investigated — No Bug Found

### Build & Static Output
- Astro config: `output: 'static'`, `trailingSlash: 'always'`, correct GitHub Pages
  `site`/`base` env vars. No issues.
- 562 pages built — all routes generate correctly across all taxonomy detail pages.
- No broken `import.meta.glob` patterns at build time.

### GitHub Pages Compatibility
- `deploy.yml` uses correct action versions in sequence.
- `daily-pipeline.yml` actions versions are valid.
- No absolute asset paths or hardcoded origins outside `astro.config.mjs`.
- `trailingSlash: 'always'` prevents redirect loops on GitHub Pages.

### Date & Timezone Handling
- `generate-pulse.mjs` uses `Intl.DateTimeFormat` with `timeZone: 'Europe/Paris'`.
- `jobs.ts` `getJobsPostedOnDate()` resolves dynamically — no hardcoded fallback.
- `seed-partner-jobs.mjs`: The static `"2026-09-29"` strings in the data array are
  overwritten at runtime by lines 574-577 (`pj.postedDate = today`). These strings
  are never persisted to disk. Not a bug.
- `sync-stats.json` correctly timestamped in ISO 8601 and Paris local time.

### Data Integrity & Schema
- All collections pass Zod schema validation at build time (confirmed by 0 build errors).
- `top-companies-250.json` is a raw client import, not a content collection — no schema
  required, no issues.

### Navigation & Internal Links
- Prior 14,926-link crawl passed with 0 broken links.
- `url()` helper correctly prepends `base` path for GitHub Pages subpath deployments.

### DailyTrackerBadge (Telemetry Icon)
- `localStorage` usage wrapped in `try/catch` — SSR-safe.
- `client:load` hydration is correct for this interactive component.
- Progress bar, time-ago, reset logic all verified correct.
- `aria-label` present on trigger button; close button has visible text.

### Pan-European Job Portals
- All 6 external links have `target="_blank" rel="noopener noreferrer"`. No XSS risk.
- Top 250 directory link targets valid internal route `/companies/`.

### PulseTicker
- `prefers-reduced-motion` media query disables animation for accessibility.
- Pause/Play button has `aria-label`. Duplicate marquee div has `aria-hidden="true"`.

### SEO
- Every page has `<title>` and `<meta name="description">` via `Layout.astro`.
- Homepage has JSON-LD `WebSite` structured data with `SearchAction`.
- Single `<h1>` per page confirmed across all audited templates.

### Privacy & Self-Hosting
- All fonts loaded from `@fontsource/*` packages — no external CDN calls.
- No tracking scripts, analytics pixels, cookie banners, or embedded API keys.

### Performance
- Fully static output — optimal TTFB on GitHub Pages CDN.
- React islands use `client:load` only where interaction is required.
- Tailwind CSS v4 via Vite — tree-shaken at build time.

---

## Post-Audit Build Verification

```
npm run build   ->  562 page(s) built  |  0 errors  |  0 warnings
npx astro check ->  0 errors           |  0 warnings |  4 hints (non-breaking)
```

The 4 remaining hints are for `z.string().url()` in `content.config.ts`. The `.url()`
method is flagged deprecated in the zod types shipped with this Astro version, but
it functions correctly and no non-deprecated replacement exists in the current API.
This is a known upstream issue — not actionable without a zod/Astro version upgrade.

---

## Files Changed in This Audit

| File                                             | Change                                              |
|--------------------------------------------------|-----------------------------------------------------|
| `.github/workflows/daily-pipeline.yml`           | Fix workflow name and comment to match 30-min cron  |
| `src/services/pulse.ts`                          | Remove double-seed, hardcoded fallbacks; add error  |
| `src/content.config.ts`                          | Import z from zod instead of deprecated astro:content |
| `src/components/islands/SearchResults.tsx`       | Fix React.FormEvent -> FormEvent<HTMLFormElement>   |
| `BUG_REPORT.md`                                  | This report                                         |
