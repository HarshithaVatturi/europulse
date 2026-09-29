/**
 * scripts/ingest-daily.mjs
 * Ingestion script to parse European Commission & European industrial RSS dispatches.
 * Normalizes, deduplicates, tags entities against EuroPulse taxonomies, and generates career impacts.
 * Run: node scripts/ingest-daily.mjs [--write]
 */

import fs from 'node:fs';
import path from 'node:path';

const RSS_URLS = [
  'https://ec.europa.eu/commission/presscorner/api/rss?language=en'
];

const newsFilePath = path.resolve(process.cwd(), 'src/data/news.json');
const writeToFile = process.argv.includes('--write');

// Entity mappings
const COUNTRY_KEYWORDS = {
  france: ['france', 'french', 'paris', 'toulouse', 'lyon'],
  germany: ['germany', 'german', 'berlin', 'munich', 'bavaria', 'stuttgart'],
  netherlands: ['netherlands', 'dutch', 'amsterdam', 'eindhoven', 'rotterdam'],
  italy: ['italy', 'italian', 'milan', 'rome', 'turin'],
  sweden: ['sweden', 'swedish', 'stockholm', 'gothenburg'],
  spain: ['spain', 'spanish', 'madrid', 'barcelona'],
  belgium: ['belgium', 'belgian', 'brussels'],
  ireland: ['ireland', 'irish', 'dublin'],
  denmark: ['denmark', 'danish', 'copenhagen'],
  finland: ['finland', 'finnish', 'helsinki'],
  austria: ['austria', 'austrian', 'vienna']
};

const INDUSTRY_KEYWORDS = {
  ai: ['artificial intelligence', 'ai act', 'machine learning', 'foundation model'],
  semiconductors: ['semiconductor', 'chips act', 'lithography', 'microchip', 'wafer'],
  energy: ['hydrogen', 'wind', 'solar', 'clean tech', 'grid', 'battery', 'renewables', 'net-zero'],
  automotive: ['electric vehicle', 'automotive', 'battery cell', 'ev charging'],
  robotics: ['robotics', 'automation', 'cobot', 'autonomous'],
  aerospace: ['aerospace', 'space', 'aviation', 'satellite', 'cryogenic'],
  technology: ['digital', 'cloud', 'cybersecurity', 'quantum', 'open source'],
  manufacturing: ['industrial', 'manufacturing', 'steel', 'factory'],
  'logistics-supply-chain': ['supply chain', 'freight', 'transport', 'corridor', 'logistics']
};

const TOPIC_KEYWORDS = {
  'eu-policy': ['commission', 'regulation', 'act', 'parliament', 'directive', 'mandate', 'treaty'],
  'sustainability': ['green', 'climate', 'carbon', 'circular', 'emissions', 'net-zero'],
  'investment': ['invest', 'fund', 'capital', 'grant', 'financing', 'billion', 'million'],
  'startups-funding': ['startup', 'scaleup', 'venture', 'seed', 'innovation hub']
};

function parseXmlItems(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemBlock = match[1];

    const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    const pubDateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    if (titleMatch && linkMatch) {
      const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      const link = linkMatch[1].trim();
      const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

      items.push({ title, link, description, pubDate });
    }
  }

  return items;
}

function classifyItem(item) {
  const fullText = `${item.title} ${item.description}`.toLowerCase();

  // Match countries
  const matchedCountries = [];
  for (const [countrySlug, kws] of Object.entries(COUNTRY_KEYWORDS)) {
    if (kws.some(kw => fullText.includes(kw))) {
      matchedCountries.push(countrySlug);
    }
  }
  if (matchedCountries.length === 0) {
    matchedCountries.push('belgium', 'france', 'germany');
  }

  // Match industries
  const matchedIndustries = [];
  for (const [indSlug, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (kws.some(kw => fullText.includes(kw))) {
      matchedIndustries.push(indSlug);
    }
  }
  if (matchedIndustries.length === 0) {
    matchedIndustries.push('technology');
  }

  // Match topics
  const matchedTopics = [];
  for (const [topicSlug, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some(kw => fullText.includes(kw))) {
      matchedTopics.push(topicSlug);
    }
  }
  if (matchedTopics.length === 0) {
    matchedTopics.push('eu-policy');
  }

  // Generate Career Impact
  let careerImpact = 'Expands cross-border regulatory compliance, policy advisory, and technology management opportunities across European member states.';
  if (matchedIndustries.includes('ai')) {
    careerImpact = 'Accelerates hiring for AI governance officers, model evaluation specialists, and ethical AI product managers across European research hubs.';
  } else if (matchedIndustries.includes('semiconductors')) {
    careerImpact = 'Drives high-tech engineering opportunities in lithography, cleanroom process optimization, and microelectronics design.';
  } else if (matchedIndustries.includes('energy')) {
    careerImpact = 'Opens technical and project management positions in grid modernization, renewable energy storage, and industrial decarbonization.';
  }

  const slug = item.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  return {
    id: slug,
    slug,
    title: item.title,
    date: item.pubDate.toISOString().split('T')[0],
    source: {
      name: 'European Commission Press Corner',
      url: item.link
    },
    countries: matchedCountries.slice(0, 3),
    industries: matchedIndustries.slice(0, 2),
    companies: [],
    topics: matchedTopics.slice(0, 2),
    skills: ['csrd-reporting', 'corporate-strategy'],
    careerImpact,
    summary: item.description ? item.description.slice(0, 250) + '...' : item.title,
    featured: false,
    isDemo: false // Real news dispatch!
  };
}

async function main() {
  console.log('Fetching European policy and industrial RSS feeds...');
  
  const allParsed = [];

  for (const rssUrl of RSS_URLS) {
    try {
      console.log(`Fetching RSS: ${rssUrl}...`);
      const res = await fetch(rssUrl);
      if (!res.ok) {
        console.warn(`Failed to fetch ${rssUrl}: ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const rawItems = parseXmlItems(xml);
      console.log(`Parsed ${rawItems.length} items from ${rssUrl}`);

      for (const item of rawItems) {
        const classified = classifyItem(item);
        allParsed.push(classified);
      }
    } catch (err) {
      console.error(`Error parsing ${rssUrl}:`, err);
    }
  }

  console.log(`Successfully classified ${allParsed.length} live European dispatches!`);
  console.log('Sample parsed dispatch:', JSON.stringify(allParsed[0], null, 2));

  if (writeToFile) {
    const existingNews = JSON.parse(fs.readFileSync(newsFilePath, 'utf-8'));
    const existingIds = new Set(existingNews.map(n => n.id));

    let addedCount = 0;
    for (const item of allParsed) {
      if (!existingIds.has(item.id)) {
        existingNews.unshift(item);
        existingIds.add(item.id);
        addedCount++;
      }
    }

    fs.writeFileSync(newsFilePath, JSON.stringify(existingNews, null, 2), 'utf-8');
    console.log(`✓ Merged ${addedCount} new live dispatches into ${newsFilePath}`);
  } else {
    console.log('Run with --write to merge parsed dispatches into src/data/news.json');
  }
}

main().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
