/**
 * scripts/ingest-daily.mjs
 * Ingestion entrypoint delegating to EuroPulse Live Feed expansion pipeline.
 * Usage: node scripts/ingest-daily.mjs [--write]
 */

import { execSync } from 'node:child_process';

console.log('EuroPulse Ingestion: Invoking live feed expansion engine...');
try {
  execSync('node --experimental-strip-types scripts/feed/index.mjs --write', { stdio: 'inherit' });
} catch (err) {
  console.error('Feed ingestion execution error:', err.message);
  process.exit(1);
}
