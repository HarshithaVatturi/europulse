# EuroPulse Architecture & Data Pipeline Specification

EuroPulse is designed as a fully static, high-performance web platform hosted on GitHub Pages, backed by a planned autonomous data ingestion and classification pipeline. This document outlines the architectural roadmap, data engineering lifecycle, expansion interfaces, and ethical principles for EuroPulse.

---

## 1. Architectural Philosophy

1. **Static Distribution by Default**: The entire web platform compiles into deterministic, pre-rendered HTML/CSS/JS artifacts (`astro build`). This guarantees zero database operating costs, zero server maintenance overhead, millisecond TTFB via CDN edges, and rock-solid resilience against traffic spikes.
2. **Data-as-Code**: Content collections in `src/data/` act as the authoritative repository database. Every entity (Country, Industry, Company, Skill, Role, Job, News, Pulse) is validated against strict Zod schemas with compile-time referential integrity checking (`astro check`).
3. **Decoupled Ingestion Pipeline**: Ingestion and AI enrichment execute in an independent CI/CD runner or scheduled serverless worker (GitHub Actions Cron). The web client remains 100% decoupled from data scrapers and LLM latency.
4. **Graph-Derived Relationships**: Bidirectional links (e.g., Company → Jobs, Degree → Career Path, News → Career Impact Trail) are calculated at build-time using `src/lib/graph.ts`, ensuring O(1) page lookups with zero client-side graph overhead.

---

## 2. Planned Daily Ingestion Pipeline

```
+-------------------------------------------------------------+
|                     EXTERNAL DATA SOURCES                   |
|  - Publisher RSS Feeds (FT, Reuters, Politico EU, Les Echos)|
|  - GDELT Project API (European Tech & Industrial Events)   |
|  - Job APIs (Arbeitnow API, Adzuna, Official Career Feeds)  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  1. EXTRACTION & NORMALIZATION               |
|  - Scheduled GitHub Action runs daily at 05:00 CET          |
|  - Fetch candidate feeds with strict rate-limiting          |
|  - Enforce publisher robot policies & API terms of service  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  2. DEDUPLICATION & FILTERING               |
|  - Title / URL canonicalization & MinHash semantic dedupe   |
|  - Geofence filtering: EU-27, EEA & Switzerland only        |
|  - Discard generic consumer/political non-industrial stories|
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               3. AI CLASSIFICATION & ENRICHMENT              |
|  - LLM Inference (Gemini / Claude via Structured Outputs)   |
|  - Taxonomy Matching: Exact match against valid slugs       |
|    * Industries (from src/data/industries.json)             |
|    * Countries (from src/data/countries.json)               |
|    * Companies (from src/data/companies.json)               |
|    * Skills (from src/data/skills.json)                     |
|  - Generate Career Impact Trail (1-2 sentences)             |
|  - Original, synthesized summary (<= 60 words)              |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  4. VALIDATION & SERIALIZATION              |
|  - Validate payload against Zod schema (isDemo: false)      |
|  - Compute daily Europe Business Pulse (pulse/YYYY-MM-DD.json)
|  - Append to src/data/news.json and src/data/jobs.json      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  5. GIT COMMIT & AUTOMATIC DEPLOY           |
|  - Git commit & push automated PR or push directly to main |
|  - Triggers .github/workflows/deploy.yml                    |
|  - astro check -> build -> GitHub Pages static deploy       |
+-------------------------------------------------------------+
```

---

## 3. Extension Points & External Integrations

### 3.1 Eurostat Macroeconomic Data
- **Current State**: Country pages render an honest, designed empty state panel reading *"Eurostat integration planned"* for volatile indicators (GDP growth, unemployment, youth employment).
- **Target Integration**:
  - Consume the **Eurostat REST API** (`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/`).
  - Datasets: `nama_10_gdp` (Quarterly Real GDP Growth), `une_rt_m` (Harmonized Unemployment Rate), and `edat_lfse_20` (Youth Employment/Education Rates).
  - During the daily build, a pre-build fetch script (`scripts/fetch-eurostat.mjs`) pulls latest figures for all 14 supported ISO-2 countries, saving a static snapshot in `src/data/macro/indicators.json`.
  - Zero client-side API requests; figures are baked directly into the country HTML.

### 3.2 Search Backend (MiniSearch -> Serverless Index)
- **Current State**: MiniSearch runs client-side with a build-time pre-indexed JSON (`/api/search-index.json`) loaded lazily on ⌘K / Ctrl+K or search bar focus. Fast, offline-capable, and zero-cost for up to 10,000 documents.
- **Future Scale Path**:
  - Once indexed records exceed 20,000 items, swap the client MiniSearch engine with **Pagefind** (Astro static search integration) or a hybrid **Typesense/Algolia** client.
  - The abstraction layer in `src/lib/search.ts` isolates index loading, query matching, alias expansions, and "Jump to" generation. The UI island `SearchPalette.tsx` requires zero code changes when switching search backends.

### 3.3 Newsletter Provider Integration
- **Current State**: Newsletter subscription form in `src/components/ui/Footer.astro` and `src/pages/index.astro` renders an honest *"Launching soon"* notification modal and records intent locally.
- **Future Scale Path**:
  - Connect form submissions to a privacy-friendly European provider (such as **Brevo/Sendinblue**, **Buttondown**, or **Mailjet**).
  - Form action directs to a static webhook or lightweight Cloudflare Worker / GitHub Pages redirect handler with zero tracker cookies.

---

## 4. Ethics, Copyright & Data Integrity

EuroPulse adheres to strict data ethics and intellectual property standards:
1. **No Article Mirroring**: EuroPulse never scrapes, caches, or reproduces full publisher articles. We store only concise headlines, original journalistic summaries (≤60 words written independently), and deep-link directly to the original publisher.
2. **Publisher Traffic Attribution**: All news citations attribute the source name and link directly to the publisher's origin. The publisher receives 100% of reading traffic.
3. **No Terms of Service Violations**: Job listings and news feeds utilize only permitted public APIs or official RSS syndication feeds.
4. **Honest Public Disclosures**:
   - Company profiles reflect stable public registry facts (HQ, sector, founding year, product lines). No unverified revenue figures or employee headcounts.
   - Illustrative sample data is marked transparently with `isDemo: true`, rendering visible "Demo" badges, `noindex` robots meta tags, and exclusion from public XML sitemaps.
   - Visas and post-study work notes link exclusively to official government portals (e.g., Campus France, DAAD, Make it in Germany, IND Netherlands).
