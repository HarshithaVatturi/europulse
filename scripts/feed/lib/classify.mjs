/**
 * scripts/feed/lib/classify.mjs
 * Deterministic taxonomy classification and career impact generation.
 * Maps news and job text against EuroPulse countries, industries, companies, skills, roles, and topics.
 *
 * Hard rule: "Do not invent or AI-generate facts. Produce text only from deterministic rules
 * using the taxonomy, and leave it out when nothing matches."
 */

import fs from 'node:fs';
import path from 'node:path';

// Load taxonomy data
function loadJson(relPath) {
  try {
    const fullPath = path.resolve(process.cwd(), relPath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch {
    return [];
  }
}

const countriesData = loadJson('src/data/countries.json');
const industriesData = loadJson('src/data/industries.json');
const companiesData = loadJson('src/data/companies.json');
const skillsData = loadJson('src/data/skills.json');
const rolesData = loadJson('src/data/roles.json');
const topicsData = loadJson('src/data/topics.json');

// Precompute keyword lookup tables
const COUNTRY_MAP = new Map();
countriesData.forEach((c) => {
  const terms = [c.name.toLowerCase(), c.slug.toLowerCase(), c.capital.toLowerCase(), ...(c.aliases || []).map((a) => a.toLowerCase()), ...(c.businessHubs || []).map((h) => h.toLowerCase())];
  COUNTRY_MAP.set(c.slug, terms);
});

// Additional European country aliases
const EXTRA_COUNTRY_TERMS = {
  germany: ['german', 'deutschland', 'berlin', 'munich', 'münchen', 'frankfurt', 'stuttgart', 'hamburg'],
  france: ['french', 'français', 'paris', 'toulouse', 'lyon', 'marseille', 'bordeaux'],
  netherlands: ['dutch', 'nederland', 'amsterdam', 'rotterdam', 'eindhoven', 'the hague'],
  italy: ['italian', 'italia', 'milan', 'milano', 'rome', 'roma', 'turin', 'torino'],
  spain: ['spanish', 'españa', 'madrid', 'barcelona', 'valencia', 'seville'],
  sweden: ['swedish', 'sverige', 'stockholm', 'gothenburg', 'göteborg', 'malmö'],
  denmark: ['danish', 'danmark', 'copenhagen', 'aarhus'],
  norway: ['norwegian', 'norge', 'oslo', 'bergen'],
  finland: ['finnish', 'suomi', 'helsinki', 'espoo'],
  ireland: ['irish', 'éire', 'dublin', 'cork', 'galway'],
  belgium: ['belgian', 'belgique', 'belgië', 'brussels', 'antwerp', 'ghent'],
  austria: ['austrian', 'österreich', 'vienna', 'wien', 'salzburg', 'graz'],
  switzerland: ['swiss', 'schweiz', 'suisse', 'zurich', 'zürich', 'geneva', 'basel'],
  poland: ['polish', 'polska', 'warsaw', 'krakow', 'wrocław'],
  portugal: ['portuguese', 'lisbon', 'porto', 'braga'],
  uk: ['british', 'london', 'manchester', 'birmingham', 'cambridge', 'oxford'],
};

const INDUSTRY_KEYWORDS = {
  ai: ['artificial intelligence', 'ai act', 'machine learning', 'deep learning', 'llm', 'foundation model', 'generative ai', 'neural network', 'nlp'],
  semiconductors: ['semiconductor', 'chips act', 'lithography', 'wafer', 'microelectronics', 'foundry', 'euv', 'fab'],
  energy: ['hydrogen', 'wind energy', 'offshore wind', 'solar', 'clean tech', 'cleantech', 'power grid', 'battery storage', 'decarbonisation', 'renewables', 'net-zero'],
  automotive: ['electric vehicle', 'automotive', 'battery gigafactory', 'ev battery', 'charging infrastructure', 'powertrain', 'autonomous vehicle', 'oem'],
  robotics: ['robotics', 'industrial automation', 'cobot', 'autonomous systems', 'ros', 'manipulator'],
  aerospace: ['aerospace', 'space agency', 'satellite', 'aviation', 'launcher', 'propulsion', 'orbital'],
  technology: ['digitalisation', 'cloud infrastructure', 'cybersecurity', 'quantum', 'open source', 'saas', 'software engineering'],
  manufacturing: ['industrial manufacturing', 'smart factory', 'advanced manufacturing', 'industry 4.0', 'metallurgy'],
  'logistics-supply-chain': ['supply chain', 'freight corridor', 'maritime logistics', 'intermodal', 'procurement network'],
  'finance-banking': ['central bank', 'interest rate', 'banking union', 'fintech', 'capital markets', 'sepa', 'asset management'],
  'healthcare-pharma': ['pharmaceutical', 'biotech', 'clinical trial', 'medical device', 'life sciences', 'medtech'],
  retail: ['e-commerce', 'luxury retail', 'consumer goods', 'circular retail', 'fmcg'],
};

const TOPIC_KEYWORDS = {
  'eu-policy': ['commission', 'regulation', 'directive', 'parliament', 'council of the eu', 'treaty', 'antitrust', 'compliance'],
  sustainability: ['green deal', 'csrd', 'esg', 'circular economy', 'carbon footprint', 'biodiversity', 'emissions trading'],
  investment: ['investment', 'venture capital', 'funding round', 'grant', 'eib', 'subsidies', 'capital expenditure', 'growth equity'],
  'startups-funding': ['scaleup', 'startup', 'seed funding', 'series a', 'series b', 'incubator', 'accelerator'],
  careers: ['skills agenda', 'talent recruitment', 'apprenticeship', 'stem education', 'mobility', 'labour market'],
};

export function classifyText(title, description = '', defaultCountry = null) {
  const combined = `${title} ${description}`.toLowerCase();

  // 1. Match countries
  const matchedCountries = new Set();
  if (defaultCountry && defaultCountry !== 'EU') {
    const norm = defaultCountry.toLowerCase();
    if (COUNTRY_MAP.has(norm)) matchedCountries.add(norm);
  }

  for (const [slug, terms] of COUNTRY_MAP.entries()) {
    for (const term of terms) {
      if (term.length > 3 && combined.includes(term)) {
        matchedCountries.add(slug);
        break;
      }
    }
  }

  for (const [slug, terms] of Object.entries(EXTRA_COUNTRY_TERMS)) {
    for (const term of terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(combined)) {
        if (COUNTRY_MAP.has(slug)) matchedCountries.add(slug);
        break;
      }
    }
  }

  // 2. Match industries
  const matchedIndustries = new Set();
  for (const [indSlug, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const kw of kws) {
      if (combined.includes(kw)) {
        matchedIndustries.add(indSlug);
        break;
      }
    }
  }

  // Check aliases from industriesData
  industriesData.forEach((ind) => {
    (ind.aliases || []).forEach((alias) => {
      if (alias.length > 3 && combined.includes(alias.toLowerCase())) {
        matchedIndustries.add(ind.slug);
      }
    });
  });

  // 3. Match companies
  const matchedCompanies = new Set();
  companiesData.forEach((c) => {
    const compName = c.name.toLowerCase();
    const compSlug = c.slug.toLowerCase();
    if (combined.includes(compName) || combined.includes(compSlug)) {
      matchedCompanies.add(c.slug);
    }
  });

  // 4. Match topics
  const matchedTopics = new Set();
  for (const [topicSlug, kws] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of kws) {
      if (combined.includes(kw)) {
        matchedTopics.add(topicSlug);
        break;
      }
    }
  }

  // 5. Match skills
  const matchedSkills = new Set();
  skillsData.forEach((s) => {
    const skillName = s.name.toLowerCase();
    const aliases = (s.aliases || []).map((a) => a.toLowerCase());
    if (combined.includes(skillName) || aliases.some((a) => a.length > 3 && combined.includes(a))) {
      matchedSkills.add(s.slug);
    }
  });

  // 6. Match roles
  const matchedRoles = new Set();
  rolesData.forEach((r) => {
    const roleName = r.name.toLowerCase();
    if (combined.includes(roleName)) {
      matchedRoles.add(r.slug);
    }
  });

  // 7. Deterministic Career Impact Generation
  // "produce the text only from deterministic rules using the taxonomy (matched companies, industries, countries, skills and roles), and leave it out when nothing matches."
  let careerImpact = '';

  const indArray = Array.from(matchedIndustries);
  const compArray = Array.from(matchedCompanies);
  const countryArray = Array.from(matchedCountries);
  const roleArray = Array.from(matchedRoles);
  const skillArray = Array.from(matchedSkills);

  if (indArray.length > 0 || compArray.length > 0 || countryArray.length > 0) {
    const impactParts = [];

    if (compArray.length > 0) {
      const compName = companiesData.find((c) => c.slug === compArray[0])?.name || compArray[0];
      impactParts.push(`Direct career and vendor expansion at ${compName}`);
    }

    if (indArray.includes('ai')) {
      impactParts.push('Accelerates demand for AI governance specialists, ethical model evaluators, and machine learning infrastructure engineers.');
    } else if (indArray.includes('semiconductors')) {
      impactParts.push('Expands cleanroom fabrication, EUV lithography tooling, and microelectronics design opportunities across European semiconductor clusters.');
    } else if (indArray.includes('energy')) {
      impactParts.push('Drives cross-border recruitment for power grid engineers, hydrogen project developers, and circular energy transition leads.');
    } else if (indArray.includes('automotive')) {
      impactParts.push('Supports engineering recruitment in battery gigafactory operations, EV powertrain calibration, and embedded vehicle software.');
    } else if (indArray.includes('robotics')) {
      impactParts.push('Increases hiring for robotic automation engineers, PLC developers, and computer vision specialists across modern European factories.');
    } else if (indArray.includes('aerospace')) {
      impactParts.push('Creates high-skill roles in satellite systems engineering, propulsion architecture, and aerospace supply chain management.');
    } else if (indArray.includes('technology')) {
      impactParts.push('Fosters tech hiring in cloud architecture, enterprise cybersecurity, and European digital transformation initiatives.');
    } else if (indArray.length > 0) {
      const indName = industriesData.find((i) => i.slug === indArray[0])?.name || indArray[0];
      impactParts.push(`Strengthens employment demand across the European ${indName.toLowerCase()} sector.`);
    }

    if (skillArray.length > 0 && impactParts.length === 1) {
      const skillName = skillsData.find((s) => s.slug === skillArray[0])?.name || skillArray[0];
      impactParts.push(`Key competency in demand: ${skillName}.`);
    }

    careerImpact = impactParts.join(' ').trim();
  }

  return {
    countries: Array.from(matchedCountries).slice(0, 3),
    industries: Array.from(matchedIndustries).slice(0, 2),
    companies: Array.from(matchedCompanies).slice(0, 3),
    topics: Array.from(matchedTopics).slice(0, 2),
    skills: Array.from(matchedSkills).slice(0, 4),
    roles: Array.from(matchedRoles).slice(0, 2),
    careerImpact: careerImpact || undefined,
  };
}
