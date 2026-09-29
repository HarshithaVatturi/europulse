/**
 * scripts/fetch-eurostat.mjs
 * Fetches real macroeconomic indicators for EuroPulse's 14 European economies from Eurostat REST API.
 * Datasets:
 *  - namq_10_gdp: Real GDP growth rate quarter-on-quarter
 *  - une_rt_m: Monthly harmonised unemployment rate & youth unemployment
 * Outputs to src/data/macro/indicators.json
 */

import fs from 'node:fs';
import path from 'node:path';

const COUNTRIES = [
  'FR', 'DE', 'NL', 'IT', 'ES', 'SE', 'CH', 'IE', 'BE', 'DK', 'FI', 'AT', 'NO', 'PT'
];

const outputDir = path.resolve(process.cwd(), 'src/data/macro');
const outputFile = path.join(outputDir, 'indicators.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function parseJsonStat(data, geoDimension = 'geo') {
  const dims = data.id;
  const sizes = data.size;
  const geoIdx = dims.indexOf(geoDimension);
  const timeIdx = dims.indexOf('time');
  
  if (geoIdx === -1 || timeIdx === -1) {
    throw new Error('Required dimensions not found in JSON-stat payload');
  }

  const timeCategories = Object.keys(data.dimension.time.category.index);
  const latestTimeIdx = timeCategories.length - 1;
  const latestTimePeriod = timeCategories[latestTimeIdx];

  const results = {};

  const geoCategories = data.dimension[geoDimension].category.index;
  for (const [geoCode, gIndex] of Object.entries(geoCategories)) {
    // Try latest period, fall back to previous period if null/undefined
    for (let t = latestTimeIdx; t >= Math.max(0, latestTimeIdx - 4); t--) {
      const coord = new Array(dims.length).fill(0);
      coord[geoIdx] = gIndex;
      coord[timeIdx] = t;

      let flatIdx = 0;
      let mult = 1;
      for (let i = sizes.length - 1; i >= 0; i--) {
        flatIdx += coord[i] * mult;
        mult *= sizes[i];
      }

      const val = data.value[flatIdx];
      if (val !== undefined && val !== null) {
        results[geoCode] = {
          value: Number(val),
          period: timeCategories[t]
        };
        break;
      }
    }
  }

  return { results, latestPeriod: latestTimePeriod };
}

async function fetchGDP() {
  const geoParams = COUNTRIES.map(c => `geo=${c}`).join('&');
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/namq_10_gdp?${geoParams}&unit=CLV_PCH_PRE&na_item=B1GQ&s_adj=SCA`;
  console.log('Fetching GDP growth from Eurostat...');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GDP fetch failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return parseJsonStat(json);
}

async function fetchUnemployment(youth = false) {
  const geoParams = COUNTRIES.map(c => `geo=${c}`).join('&');
  const ageParam = youth ? 'age=Y_LT25' : 'age=TOTAL';
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m?${geoParams}&s_adj=SA&${ageParam}&unit=PC_ACT&sex=T`;
  console.log(`Fetching ${youth ? 'Youth Unemployment' : 'Unemployment'} from Eurostat...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Unemployment fetch failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return parseJsonStat(json);
}

async function main() {
  console.log(`Starting Eurostat macroeconomic data fetch for ${COUNTRIES.length} countries...`);
  
  try {
    const [gdpData, unempData, youthUnempData] = await Promise.all([
      fetchGDP(),
      fetchUnemployment(false),
      fetchUnemployment(true)
    ]);

    const indicatorsByIso = {};

    for (const iso of COUNTRIES) {
      const gdp = gdpData.results[iso];
      const unemp = unempData.results[iso];
      const youth = youthUnempData.results[iso];

      indicatorsByIso[iso] = {
        iso2: iso,
        gdpGrowthRate: gdp ? gdp.value : null,
        gdpPeriod: gdp ? gdp.period : null,
        unemploymentRate: unemp ? unemp.value : null,
        unemploymentPeriod: unemp ? unemp.period : null,
        youthUnemploymentRate: youth ? youth.value : null,
        youthUnemploymentPeriod: youth ? youth.period : null,
        source: 'Eurostat Official API (namq_10_gdp, une_rt_m)',
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }

    fs.writeFileSync(outputFile, JSON.stringify(indicatorsByIso, null, 2), 'utf-8');
    console.log(`✓ Eurostat indicators successfully written to: ${outputFile}`);
    console.log(`Sample DE:`, JSON.stringify(indicatorsByIso['DE']));
    console.log(`Sample FR:`, JSON.stringify(indicatorsByIso['FR']));
  } catch (err) {
    console.error('Error fetching Eurostat data:', err);
    process.exit(1);
  }
}

main();
