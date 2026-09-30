/**
 * scripts/feed/tests/run-tests.mjs
 * Unit test suite for feed parser, normalizer, dedupe, and taxonomy classifier.
 * Uses local mock fixtures — ZERO network hits.
 *
 * Run: node scripts/feed/tests/run-tests.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import { parseFeedXml, cleanText, createExcerpt } from '../lib/rss-parser.mjs';
import { classifyText } from '../lib/classify.mjs';
import { normalizeNewsItem } from '../lib/normalize-news.mjs';
import { normalizeJobItem } from '../lib/normalize-job.mjs';
import { dedupeAndFilterNews, dedupeAndFilterJobs } from '../lib/dedupe.mjs';

const fixturesDir = path.resolve(process.cwd(), 'scripts/feed/tests/fixtures');

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    process.exit(1);
  }
}

console.log('Running EuroPulse Feed Unit Tests (Fixture-Only, Offline)...');

// 1. Parser Tests
runTest('cleanText should strip HTML and CDATA', () => {
  const raw = '<p><![CDATA[Hello <b>World</b> &amp; Europe]]></p>';
  const cleaned = cleanText(raw);
  assert.equal(cleaned, 'Hello World & Europe');
});

runTest('createExcerpt should truncate at or below 200 characters', () => {
  const longText = 'A'.repeat(300);
  const excerpt = createExcerpt(longText, 200);
  assert.ok(excerpt.length <= 203, `Excerpt length ${excerpt.length} exceeds limit`);
  assert.ok(excerpt.endsWith('...'));
});

runTest('parseFeedXml should correctly parse RSS 2.0 fixture', () => {
  const xml = fs.readFileSync(path.join(fixturesDir, 'sample-rss.xml'), 'utf-8');
  const items = parseFeedXml(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'EU AI Act Implementation Accelerates Across Member States');
  assert.ok(items[0].excerpt.length <= 200);
  assert.equal(items[1].title, 'Semiconductor Lithography Investment Announced in Eindhoven');
});

runTest('parseFeedXml should correctly parse Atom 1.0 fixture', () => {
  const xml = fs.readFileSync(path.join(fixturesDir, 'sample-atom.xml'), 'utf-8');
  const items = parseFeedXml(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Offshore Wind Expansion in the North Sea');
  assert.equal(items[0].link, 'https://example.eu/articles/offshore-wind');
});

// 2. Classifier Tests
runTest('classifyText should deterministically detect AI, countries, and generate career impact', () => {
  const title = 'EU AI Act Conformity Hub Opens in Paris';
  const desc = 'European tech leaders establish AI model testing facility in France.';
  const res = classifyText(title, desc);

  assert.ok(res.industries.includes('ai'), 'Should classify AI industry');
  assert.ok(res.countries.includes('france'), 'Should classify France');
  assert.ok(res.careerImpact && res.careerImpact.length > 10, 'Should generate deterministic career impact');
});

runTest('classifyText should leave out career impact when nothing matches', () => {
  const title = 'General administrative update';
  const desc = 'Routine procedures acknowledged.';
  const res = classifyText(title, desc);
  assert.equal(res.careerImpact, undefined, 'Should be undefined when no taxonomy matches');
});

// 3. News Normalizer Tests
runTest('normalizeNewsItem should return valid schema object for news', () => {
  const rawItem = {
    title: 'Clean Hydrogen Pipeline Approved for Germany and France',
    link: 'https://example.eu/news/hydrogen-2026',
    description: 'European Commission greenlights cross-border hydrogen transmission network.',
    pubDate: new Date('2026-09-30T10:00:00Z'),
  };
  const source = {
    id: 'test-source',
    name: 'European Test News',
    country: 'EU',
    language: 'en',
  };

  const normalized = normalizeNewsItem(rawItem, source);
  assert.ok(normalized);
  assert.equal(normalized.date, '2026-09-30');
  assert.equal(normalized.source.name, 'European Test News');
  assert.equal(normalized.source.url, 'https://example.eu/news/hydrogen-2026');
  assert.ok(normalized.excerpt.length <= 200);
});

// 4. Job Normalizer Tests
runTest('normalizeJobItem should extract job fields and preserve visa sponsorship flag', () => {
  const json = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'sample-arbeitnow.json'), 'utf-8'));
  const rawJob = json.data[0];

  const normalized = normalizeJobItem(rawJob, 'Arbeitnow Career Feed');
  assert.ok(normalized);
  assert.equal(normalized.company, 'celonis');
  assert.equal(normalized.visaSponsorship, true);
  assert.equal(normalized.function, 'Software Engineering');
  assert.equal(normalized.applyUrl, 'https://www.arbeitnow.com/view/celonis-lead-engineer-12345');
});

// 5. Deduplication and Retention Tests
runTest('dedupeAndFilterJobs should deduplicate identical roles and track alsoSeenOn', () => {
  const job1 = {
    id: 'celonis-lead-engineer-berlin',
    company: 'celonis',
    title: 'Lead Software Engineer',
    city: 'Berlin',
    country: 'germany',
    postedDate: '2026-09-30',
    source: 'Arbeitnow',
    applyUrl: 'https://arbeitnow.com/job1',
    skills: ['python'],
  };
  const job2 = {
    id: 'celonis-lead-engineer-berlin-alt',
    company: 'celonis',
    title: 'Lead Software Engineer',
    city: 'Berlin',
    country: 'germany',
    postedDate: '2026-09-30',
    source: 'Celonis Direct Careers',
    applyUrl: 'https://celonis.com/careers/job1',
    skills: ['python', 'docker', 'typescript'],
  };

  const deduped = dedupeAndFilterJobs([], [job1, job2]);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].source, 'Celonis Direct Careers', 'Richest job (more skills) should win');
  assert.ok(deduped[0].alsoSeenOn.includes('Arbeitnow'), 'Other source should be recorded in alsoSeenOn');
});

runTest('dedupeAndFilterNews should drop items older than 14 days', () => {
  const freshItem = {
    id: 'fresh-news',
    title: 'Fresh News',
    date: '2026-09-30',
  };
  const oldItem = {
    id: 'old-news',
    title: 'Old News',
    date: '2026-08-01', // over 40 days old
  };

  const result = dedupeAndFilterNews([], [freshItem, oldItem]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'fresh-news');
});

console.log('\nAll 9 unit test suites passed successfully with ZERO network calls! ✓');
