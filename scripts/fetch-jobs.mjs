/**
 * scripts/fetch-jobs.mjs
 * Ingestion script to fetch live European jobs from Arbeitnow's public European job board API.
 * Maps live jobs to EuroPulse taxonomies (functions, industries, countries, skills, degrees).
 * Run: node scripts/fetch-jobs.mjs [--write]
 */

import fs from 'node:fs';
import path from 'node:path';

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';
const jobsFilePath = path.resolve(process.cwd(), 'src/data/jobs.json');

const writeToFile = process.argv.includes('--write');

// City to Country mapping
const CITY_TO_COUNTRY = {
  berlin: 'germany',
  munich: 'germany',
  münchen: 'germany',
  frankfurt: 'germany',
  stuttgart: 'germany',
  hamburg: 'germany',
  cologne: 'germany',
  köln: 'germany',
  paris: 'france',
  toulouse: 'france',
  lyon: 'france',
  amsterdam: 'netherlands',
  eindhoven: 'netherlands',
  rotterdam: 'netherlands',
  milan: 'italy',
  milano: 'italy',
  rome: 'italy',
  roma: 'italy',
  stockholm: 'sweden',
  gothenburg: 'sweden',
  göteborg: 'sweden',
  madrid: 'spain',
  barcelona: 'spain',
  dublin: 'ireland',
  brussels: 'belgium',
  copenhagen: 'denmark',
  helsinki: 'finland',
  vienna: 'austria',
  wien: 'austria',
  oslo: 'norway',
  lisbon: 'portugal',
  porto: 'portugal',
  zurich: 'switzerland',
  zürich: 'switzerland',
};

// Skill keyword matching
const SKILL_KEYWORDS = {
  python: 'python',
  typescript: 'typescript',
  javascript: 'typescript',
  react: 'typescript',
  'machine learning': 'machine-learning',
  ai: 'machine-learning',
  'deep learning': 'deep-learning',
  sql: 'sql-analytics',
  analytics: 'sql-analytics',
  aws: 'cloud-architecture',
  cloud: 'cloud-architecture',
  docker: 'devops-ci-cd',
  kubernetes: 'devops-ci-cd',
  financial: 'financial-modelling',
  valuation: 'financial-modelling',
  strategy: 'corporate-strategy',
  consulting: 'corporate-strategy',
  supply: 'supply-chain-planning',
  logistics: 'supply-chain-planning',
  product: 'product-management',
  agile: 'agile-delivery',
  scrum: 'agile-delivery',
  csrd: 'csrd-reporting',
  esg: 'csrd-reporting',
  robotics: 'ros-robotics',
  cad: 'cad-modelling'
};

function inferFunctionAndIndustry(title, tags) {
  const t = (title + ' ' + (tags || []).join(' ')).toLowerCase();
  
  let func = 'Software Engineering';
  let industry = 'technology';
  let degrees = ['msc-data-science-ai'];

  if (t.includes('data scientist') || t.includes('machine learning') || t.includes('ai engineer')) {
    func = 'AI/ML';
    industry = 'ai';
    degrees = ['msc-data-science-ai'];
  } else if (t.includes('data analyst') || t.includes('bi analyst') || t.includes('business intelligence')) {
    func = 'Data Science';
    industry = 'technology';
    degrees = ['msc-data-science-ai', 'mim'];
  } else if (t.includes('product manager') || t.includes('product owner')) {
    func = 'Product Management';
    industry = 'technology';
    degrees = ['mim', 'mba', 'msc-data-science-ai'];
  } else if (t.includes('business analyst') || t.includes('operations analyst')) {
    func = 'Business Analysis';
    industry = 'technology';
    degrees = ['mim', 'mba'];
  } else if (t.includes('finance') || t.includes('accountant') || t.includes('controller')) {
    func = 'Finance';
    industry = 'finance-banking';
    degrees = ['msc-finance', 'mba', 'mim'];
  } else if (t.includes('consultant') || t.includes('strategy')) {
    func = 'Consulting';
    industry = 'technology';
    degrees = ['mim', 'mba'];
  } else if (t.includes('marketing') || t.includes('growth') || t.includes('seo')) {
    func = 'Marketing';
    industry = 'retail';
    degrees = ['msc-marketing', 'mim'];
  } else if (t.includes('supply chain') || t.includes('logistics') || t.includes('procurement')) {
    func = 'Supply Chain';
    industry = 'logistics-supply-chain';
    degrees = ['msc-supply-chain', 'mim'];
  } else if (t.includes('mechanical') || t.includes('aerospace') || t.includes('hardware')) {
    func = 'Mechanical Engineering';
    industry = 'manufacturing';
    degrees = ['msc-mechanical-engineering'];
  } else if (t.includes('robot') || t.includes('automation')) {
    func = 'Robotics & Automation';
    industry = 'robotics';
    degrees = ['msc-robotics'];
  }

  return { func, industry, degrees };
}

function extractSkills(text) {
  const lower = text.toLowerCase();
  const matched = new Set();
  for (const [kw, slug] of Object.entries(SKILL_KEYWORDS)) {
    if (lower.includes(kw)) {
      matched.add(slug);
    }
  }
  return Array.from(matched).slice(0, 5);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

async function main() {
  console.log(`Connecting to European Job API: ${API_URL}...`);
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rawJobs = json.data || [];
  console.log(`Retrieved ${rawJobs.length} raw jobs from API.`);

  const normalizedJobs = [];

  for (const job of rawJobs) {
    const locLower = (job.location || '').toLowerCase();
    
    // Find matching country
    let countrySlug = null;
    let city = job.location || 'European Hub';

    for (const [cityName, cSlug] of Object.entries(CITY_TO_COUNTRY)) {
      if (locLower.includes(cityName)) {
        countrySlug = cSlug;
        city = cityName.charAt(0).toUpperCase() + cityName.slice(1);
        break;
      }
    }

    // Default to Germany if Berlin/Munich or Europe
    if (!countrySlug && (locLower.includes('europe') || locLower.includes('eu') || job.remote)) {
      countrySlug = 'germany';
      city = 'Berlin';
    }

    if (!countrySlug) continue;

    const { func, industry, degrees } = inferFunctionAndIndustry(job.title, job.tags);
    const skills = extractSkills(`${job.title} ${job.description} ${(job.tags || []).join(' ')}`);
    if (skills.length === 0) {
      skills.push('python', 'agile-delivery');
    }

    const companySlug = slugify(job.company_name);
    const jobSlug = `${companySlug}-${slugify(job.title)}`;

    const workMode = job.remote ? 'Remote' : 'Hybrid';
    const experience = '1-3 Years';
    const employmentType = 'Full-time';

    const normalized = {
      id: jobSlug,
      slug: jobSlug,
      title: job.title,
      company: companySlug,
      country: countrySlug,
      city,
      industry,
      function: func,
      degrees,
      experience,
      employmentType,
      workMode,
      languages: ['English'],
      skills,
      postedDate: new Date(job.created_at * 1000).toISOString().split('T')[0],
      source: 'Arbeitnow European Career Feed',
      applyUrl: job.url,
      featured: false,
      isDemo: false // REAL live job!
    };

    normalizedJobs.push(normalized);
  }

  console.log(`Successfully mapped ${normalizedJobs.length} European jobs to EuroPulse schemas!`);
  console.log('Sample parsed job:', JSON.stringify(normalizedJobs[0], null, 2));

  if (writeToFile) {
    const existing = JSON.parse(fs.readFileSync(jobsFilePath, 'utf-8'));
    const existingIds = new Set(existing.map(j => j.id));
    
    let addedCount = 0;
    for (const nj of normalizedJobs) {
      if (!existingIds.has(nj.id)) {
        existing.push(nj);
        existingIds.add(nj.id);
        addedCount++;
      }
    }

    fs.writeFileSync(jobsFilePath, JSON.stringify(existing, null, 2), 'utf-8');
    console.log(`✓ Merged ${addedCount} new live jobs into ${jobsFilePath}`);
  } else {
    console.log(`Run with --write to merge parsed live jobs into src/data/jobs.json`);
  }
}

main().catch(err => {
  console.error('Job ingestion failed:', err);
  process.exit(1);
});
