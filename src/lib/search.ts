import MiniSearch from 'minisearch';
import { url } from './url';

export interface SearchDoc {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  keywords: string;
}

export interface JumpToResult {
  label: string;
  url: string;
  type: 'Jump to';
  badge: string;
}

const ALIAS_MAP: Record<string, { type: string; slug: string; name: string }> = {
  french: { type: 'country', slug: 'france', name: 'France' },
  france: { type: 'country', slug: 'france', name: 'France' },
  german: { type: 'country', slug: 'germany', name: 'Germany' },
  germany: { type: 'country', slug: 'germany', name: 'Germany' },
  dutch: { type: 'country', slug: 'netherlands', name: 'Netherlands' },
  netherlands: { type: 'country', slug: 'netherlands', name: 'Netherlands' },
  holland: { type: 'country', slug: 'netherlands', name: 'Netherlands' },
  italian: { type: 'country', slug: 'italy', name: 'Italy' },
  italy: { type: 'country', slug: 'italy', name: 'Italy' },
  swedish: { type: 'country', slug: 'sweden', name: 'Sweden' },
  sweden: { type: 'country', slug: 'sweden', name: 'Sweden' },
  chips: { type: 'industry', slug: 'semiconductors', name: 'Semiconductors' },
  silicon: { type: 'industry', slug: 'semiconductors', name: 'Semiconductors' },
  semiconductors: { type: 'industry', slug: 'semiconductors', name: 'Semiconductors' },
  robotics: { type: 'industry', slug: 'robotics', name: 'Robotics & Automation' },
  robots: { type: 'industry', slug: 'robotics', name: 'Robotics & Automation' },
  cobots: { type: 'industry', slug: 'robotics', name: 'Robotics & Automation' },
  auto: { type: 'industry', slug: 'automotive', name: 'Automotive' },
  automotive: { type: 'industry', slug: 'automotive', name: 'Automotive' },
  cars: { type: 'industry', slug: 'automotive', name: 'Automotive' },
  ev: { type: 'industry', slug: 'automotive', name: 'Automotive' },
  aerospace: { type: 'industry', slug: 'aerospace', name: 'Aerospace' },
  aviation: { type: 'industry', slug: 'aerospace', name: 'Aerospace' },
  fashion: { type: 'industry', slug: 'fashion', name: 'Fashion & Luxury' },
  luxury: { type: 'industry', slug: 'fashion', name: 'Fashion & Luxury' },
  mim: { type: 'degree', slug: 'mim', name: 'MIM' },
  mba: { type: 'degree', slug: 'mba', name: 'MBA' },
};

/**
 * Detects smart jumps such as "Robotics jobs in France" or "MIM jobs in Europe"
 */
export function getSmartJumpTo(query: string): JumpToResult | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Pattern: [Industry or Keyword] jobs in [Country]
  // or [Degree] jobs in [Country or Europe]
  let detectedIndustry = '';
  let detectedCountry = '';
  let detectedDegree = '';

  const words = q.split(/\s+/);
  for (const word of words) {
    const match = ALIAS_MAP[word];
    if (match) {
      if (match.type === 'industry') detectedIndustry = match.slug;
      if (match.type === 'country') detectedCountry = match.slug;
      if (match.type === 'degree') detectedDegree = match.slug;
    }
  }

  if (detectedIndustry && detectedCountry) {
    const indName = ALIAS_MAP[detectedIndustry]?.name || detectedIndustry;
    const countryName = ALIAS_MAP[detectedCountry]?.name || detectedCountry;
    return {
      label: `View all ${indName} jobs in ${countryName}`,
      url: url(`/jobs/?industry=${detectedIndustry}&country=${detectedCountry}`),
      type: 'Jump to',
      badge: 'Smart Filter',
    };
  }

  if (detectedDegree && (q.includes('job') || q.includes('career'))) {
    const degName = ALIAS_MAP[detectedDegree]?.name || detectedDegree.toUpperCase();
    return {
      label: `Explore ${degName} jobs & career pathways in Europe`,
      url: url(`/jobs/?degree=${detectedDegree}`),
      type: 'Jump to',
      badge: 'Degree Route',
    };
  }

  if (detectedIndustry && (q.includes('job') || q.includes('hiring'))) {
    const indName = ALIAS_MAP[detectedIndustry]?.name || detectedIndustry;
    return {
      label: `Browse all ${indName} job openings in Europe`,
      url: url(`/jobs/?industry=${detectedIndustry}`),
      type: 'Jump to',
      badge: 'Industry Jobs',
    };
  }

  if (detectedCountry && (q.includes('job') || q.includes('work'))) {
    const countryName = ALIAS_MAP[detectedCountry]?.name || detectedCountry;
    return {
      label: `Browse all active job openings in ${countryName}`,
      url: url(`/jobs/?country=${detectedCountry}`),
      type: 'Jump to',
      badge: 'Country Jobs',
    };
  }

  return null;
}

let miniSearchInstance: MiniSearch<SearchDoc> | null = null;

export async function initMiniSearch(): Promise<MiniSearch<SearchDoc>> {
  if (miniSearchInstance) return miniSearchInstance;

  const res = await fetch(url('/api/search-index.json'));
  const docs: SearchDoc[] = await res.json();

  const ms = new MiniSearch<SearchDoc>({
    fields: ['title', 'keywords', 'type'],
    storeFields: ['id', 'type', 'title', 'subtitle', 'url'],
    searchOptions: {
      boost: { title: 3, type: 2, keywords: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  ms.addAll(docs);
  miniSearchInstance = ms;
  return ms;
}

export function searchDocs(query: string, ms: MiniSearch<SearchDoc>): SearchDoc[] {
  if (!query.trim()) return [];
  const results = ms.search(query);
  return results.slice(0, 15) as unknown as SearchDoc[];
}
