/**
 * scripts/feed/lib/normalize-news.mjs
 * Normalizes raw feed items into EuroPulse NewsArticle schema with Zod validation.
 * Enforces legal safeguards:
 * - Headline, publisher name, date, excerpt <= 200 chars, link to original.
 * - Never store full text; never republish unlicensed images.
 * - Auto-ingested items carry fetchedAt, source info, and deterministic career impact.
 */

import { z } from 'zod';
import { cleanText, createExcerpt } from './rss-parser.mjs';
import { classifyText } from './classify.mjs';

export const NewsItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.object({
    name: z.string().min(1),
    url: z.string().optional(),
  }),
  summary: z.string().min(1),
  excerpt: z.string().max(250).optional(),
  careerImpact: z.string().default('Expands cross-border industrial and technology opportunities across European member states.'),
  countries: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  isDemo: z.boolean().default(false),
  fetchedAt: z.string().optional(),
  language: z.string().default('en'),
  originalLanguage: z.string().optional(),
});

function slugify(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export function normalizeNewsItem(rawItem, source) {
  if (!rawItem || !rawItem.title || !rawItem.link) return null;

  const title = cleanText(rawItem.title);
  if (!title) return null;

  const rawExcerpt = rawItem.description || rawItem.summary || rawItem.excerpt || title;
  const excerpt = createExcerpt(rawExcerpt, 200);

  // Format date
  let dateStr;
  try {
    const d = rawItem.pubDate instanceof Date ? rawItem.pubDate : new Date(rawItem.pubDate);
    if (isNaN(d.getTime())) {
      dateStr = new Date().toISOString().split('T')[0];
    } else {
      dateStr = d.toISOString().split('T')[0];
    }
  } catch {
    dateStr = new Date().toISOString().split('T')[0];
  }

  // Classify against taxonomy
  const classification = classifyText(title, excerpt, source.country);

  const baseSlug = slugify(title);
  const hash = Math.abs(rawItem.link.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0))
    .toString(36)
    .slice(0, 6);
  const slug = `${baseSlug}-${hash}`.slice(0, 70);

  const candidate = {
    id: slug,
    slug,
    title,
    date: dateStr,
    source: {
      name: source.name,
      url: rawItem.link,
    },
    summary: excerpt,
    excerpt,
    careerImpact: classification.careerImpact || 'Expands cross-border industrial and technology opportunities across European member states.',
    countries: classification.countries.length > 0 ? classification.countries : (source.country && source.country !== 'EU' ? [source.country.toLowerCase()] : []),
    industries: classification.industries,
    companies: classification.companies,
    topics: classification.topics.length > 0 ? classification.topics : ['eu-policy'],
    skills: classification.skills,
    roles: classification.roles,
    featured: false,
    isDemo: false,
    fetchedAt: new Date().toISOString(),
    language: source.language || 'en',
    originalLanguage: source.language || 'en',
  };

  const parsed = NewsItemSchema.safeParse(candidate);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
