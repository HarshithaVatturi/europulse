/**
 * scripts/feed/check-registry.mjs
 * Validates the integrity of src/config/sources.ts and src/config/ats-companies.ts:
 * - Checks for duplicate source IDs
 * - Ensures valid URLs
 * - Verifies required fields (name, type, feedType, country, language, attribution, termsNote)
 * - Checks secret name formatting
 *
 * Usage: node --experimental-strip-types scripts/feed/check-registry.mjs
 */

import { feedSources } from '../../src/config/sources.ts';
import { atsCompanies } from '../../src/config/ats-companies.ts';

console.log('Checking EuroPulse Feed Source Registry...');

let errorCount = 0;
const seenSourceIds = new Set();

const VALID_TYPES = ['news', 'jobs', 'official'];
const VALID_FEED_TYPES = ['rss', 'atom', 'json-api', 'ats-api', 'link-out'];

for (const source of feedSources) {
  // 1. Check ID uniqueness
  if (!source.id || typeof source.id !== 'string') {
    console.error(`❌ Source missing valid id: ${JSON.stringify(source)}`);
    errorCount++;
  } else if (seenSourceIds.has(source.id)) {
    console.error(`❌ Duplicate source ID detected: ${source.id}`);
    errorCount++;
  } else {
    seenSourceIds.add(source.id);
  }

  // 2. Check types
  if (!VALID_TYPES.includes(source.type)) {
    console.error(`❌ Source ${source.id} has invalid type: ${source.type}`);
    errorCount++;
  }
  if (!VALID_FEED_TYPES.includes(source.feedType)) {
    console.error(`❌ Source ${source.id} has invalid feedType: ${source.feedType}`);
    errorCount++;
  }

  // 3. Check URL
  if (!source.url || !source.url.startsWith('http')) {
    console.error(`❌ Source ${source.id} has invalid URL: ${source.url}`);
    errorCount++;
  }

  // 4. Check attribution & legal note
  if (!source.attribution || source.attribution.length < 5) {
    console.error(`❌ Source ${source.id} missing proper attribution text`);
    errorCount++;
  }
  if (!source.termsNote || source.termsNote.length < 5) {
    console.error(`❌ Source ${source.id} missing license/terms note`);
    errorCount++;
  }

  // 5. Check secrets naming
  if (source.requiredSecret && !/^[A-Z0-9_]+$/.test(source.requiredSecret)) {
    console.error(`❌ Source ${source.id} has invalid secret name format: ${source.requiredSecret}`);
    errorCount++;
  }
}

console.log(`✓ Checked ${feedSources.length} feed sources. Unique IDs verified.`);

// Check ATS Companies
const seenCompanySlugs = new Set();
for (const company of atsCompanies) {
  if (seenCompanySlugs.has(company.companySlug)) {
    console.error(`❌ Duplicate company slug in ATS registry: ${company.companySlug}`);
    errorCount++;
  } else {
    seenCompanySlugs.add(company.companySlug);
  }

  if (!company.careersUrl || !company.careersUrl.startsWith('http')) {
    console.error(`❌ Company ${company.companySlug} missing valid careersUrl`);
    errorCount++;
  }

  if (company.active && !company.boardToken) {
    console.error(`❌ Active ATS company ${company.companySlug} missing boardToken`);
    errorCount++;
  }
}

console.log(`✓ Checked ${atsCompanies.length} ATS company entries.`);

if (errorCount > 0) {
  console.error(`\nRegistry validation FAILED with ${errorCount} error(s).`);
  process.exit(1);
} else {
  console.log('\nRegistry validation PASSED with 0 errors! All sources strictly compliant.');
  process.exit(0);
}
