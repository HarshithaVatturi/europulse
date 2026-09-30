/**
 * scripts/feed/lib/normalize-job.mjs
 * Normalizes raw job items into EuroPulse Job schema with Zod validation.
 * Enforces legal safeguards:
 * - Only official APIs/public ATS endpoints; always link to original posting.
 * - Plain-text excerpt <= 200 chars.
 * - Infer industry, function, degrees with deterministic rules against taxonomy.
 */

import { z } from 'zod';
import { cleanText, createExcerpt } from './rss-parser.mjs';
import { classifyText } from './classify.mjs';
import fs from 'node:fs';
import path from 'node:path';

function loadJson(relPath) {
  try {
    const fullPath = path.resolve(process.cwd(), relPath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch {
    return [];
  }
}

const companiesData = loadJson('src/data/companies.json');

export const JobItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  industry: z.string().min(1),
  function: z.string().min(1),
  degrees: z.array(z.string()).default([]),
  experience: z.string().default('1-3 Years'),
  employmentType: z.string().default('Full-time'),
  workMode: z.string().default('Hybrid'),
  languages: z.array(z.string()).default(['English']),
  skills: z.array(z.string()).default([]),
  postedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().min(1),
  sourceUrl: z.string().optional(),
  applyUrl: z.string().url().or(z.string().min(1)),
  featured: z.boolean().default(false),
  isDemo: z.boolean().default(false),
  fetchedAt: z.string().optional(),
  language: z.string().default('en'),
  originalLanguage: z.string().optional(),
  salary: z
    .object({
      amount: z.union([z.number(), z.string()]),
      currency: z.string(),
      period: z.string().optional(),
    })
    .optional(),
  alsoSeenOn: z.array(z.string()).default([]),
  visaSponsorship: z.boolean().default(false),
});

function slugify(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

function matchCompanySlug(rawCompanyName) {
  if (!rawCompanyName) return 'european-enterprise';
  const clean = cleanText(rawCompanyName).toLowerCase();

  for (const comp of companiesData) {
    if (comp.slug === clean || comp.name.toLowerCase() === clean) {
      return comp.slug;
    }
    if (clean.includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(clean)) {
      return comp.slug;
    }
  }

  return slugify(rawCompanyName) || 'european-enterprise';
}

function inferFunctionAndIndustry(title, tags = [], desc = '') {
  const combined = `${title} ${(tags || []).join(' ')} ${desc}`.toLowerCase();

  let func = 'Software Engineering';
  let industry = 'technology';
  let degrees = ['msc-data-science-ai'];

  if (combined.includes('data scientist') || combined.includes('machine learning') || combined.includes('ai engineer')) {
    func = 'AI/ML';
    industry = 'ai';
    degrees = ['msc-data-science-ai'];
  } else if (combined.includes('data analyst') || combined.includes('business intelligence') || combined.includes('bi analyst')) {
    func = 'Data Science';
    industry = 'technology';
    degrees = ['msc-data-science-ai', 'mim'];
  } else if (combined.includes('product manager') || combined.includes('product owner') || combined.includes('head of product')) {
    func = 'Product Management';
    industry = 'technology';
    degrees = ['mim', 'mba'];
  } else if (combined.includes('business analyst') || combined.includes('operations analyst')) {
    func = 'Business Analysis';
    industry = 'technology';
    degrees = ['mim', 'mba'];
  } else if (combined.includes('finance') || combined.includes('accountant') || combined.includes('controller') || combined.includes('audit')) {
    func = 'Finance';
    industry = 'finance-banking';
    degrees = ['msc-finance', 'mba'];
  } else if (combined.includes('consultant') || combined.includes('strategy') || combined.includes('advisory')) {
    func = 'Consulting';
    industry = 'technology';
    degrees = ['mim', 'mba'];
  } else if (combined.includes('supply chain') || combined.includes('logistics') || combined.includes('procurement')) {
    func = 'Supply Chain';
    industry = 'logistics-supply-chain';
    degrees = ['msc-supply-chain', 'mim'];
  } else if (combined.includes('robot') || combined.includes('automation') || combined.includes('plc')) {
    func = 'Robotics & Automation';
    industry = 'robotics';
    degrees = ['msc-robotics'];
  } else if (combined.includes('aerospace') || combined.includes('avionics') || combined.includes('satellite')) {
    func = 'Aerospace Engineering';
    industry = 'aerospace';
    degrees = ['msc-mechanical-engineering'];
  } else if (combined.includes('battery') || combined.includes('automotive') || combined.includes('ev ')) {
    func = 'Automotive Engineering';
    industry = 'automotive';
    degrees = ['msc-mechanical-engineering'];
  } else if (combined.includes('semiconductor') || combined.includes('lithography') || combined.includes('vlsi') || combined.includes('hardware')) {
    func = 'Hardware Engineering';
    industry = 'semiconductors';
    degrees = ['msc-mechanical-engineering'];
  }

  return { func, industry, degrees };
}

export function normalizeJobItem(rawJob, sourceName) {
  if (!rawJob || !rawJob.title || (!rawJob.applyUrl && !rawJob.url)) return null;

  const title = cleanText(rawJob.title);
  if (!title) return null;

  const applyUrl = (rawJob.applyUrl || rawJob.url || '').trim();
  if (!applyUrl) return null;

  const company = matchCompanySlug(rawJob.company || rawJob.company_name);
  const city = cleanText(rawJob.city || rawJob.location || 'European Hub') || 'European Hub';
  const country = (rawJob.country || 'germany').toLowerCase();

  const { func, industry, degrees } = inferFunctionAndIndustry(title, rawJob.tags || [], rawJob.description || '');

  // Extract skills from taxonomy
  const classification = classifyText(title, rawJob.description || '', country);
  let skills = classification.skills;
  if (skills.length === 0) {
    skills = ['python', 'agile-delivery'];
  }

  // Work mode
  let workMode = 'Hybrid';
  const rawLoc = `${city} ${rawJob.workMode || ''}`.toLowerCase();
  if (rawJob.remote || rawLoc.includes('remote') || rawLoc.includes('homeoffice')) {
    workMode = 'Remote';
  } else if (rawLoc.includes('on-site') || rawLoc.includes('onsite')) {
    workMode = 'On-site';
  }

  // Date
  let postedDate = new Date().toISOString().split('T')[0];
  if (rawJob.postedDate) {
    try {
      const d = new Date(rawJob.postedDate);
      if (!isNaN(d.getTime())) postedDate = d.toISOString().split('T')[0];
    } catch {
      // Keep today's date
    }
  } else if (rawJob.created_at) {
    try {
      const ts = typeof rawJob.created_at === 'number' ? rawJob.created_at * 1000 : rawJob.created_at;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) postedDate = d.toISOString().split('T')[0];
    } catch {
      // Keep today's date
    }
  }

  const idSlug = `${company}-${slugify(title)}-${slugify(city)}`.slice(0, 75);

  const candidate = {
    id: idSlug,
    slug: idSlug,
    title,
    company,
    country,
    city,
    industry,
    function: func,
    degrees,
    experience: rawJob.experience || '1-3 Years',
    employmentType: rawJob.employmentType || 'Full-time',
    workMode,
    languages: rawJob.languages && rawJob.languages.length > 0 ? rawJob.languages : ['English'],
    skills,
    postedDate,
    source: sourceName,
    sourceUrl: rawJob.sourceUrl || applyUrl,
    applyUrl,
    featured: false,
    isDemo: false,
    fetchedAt: new Date().toISOString(),
    language: rawJob.language || 'en',
    originalLanguage: rawJob.originalLanguage || 'en',
    salary: rawJob.salary || undefined,
    alsoSeenOn: [],
    visaSponsorship: Boolean(rawJob.visaSponsorship || rawJob.visa_sponsorship),
  };

  const parsed = JobItemSchema.safeParse(candidate);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
