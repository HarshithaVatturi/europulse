import { getCollection } from 'astro:content';
import type { NewsArticle, NewsFilterParams } from '@/types';

export async function getNews(filters?: NewsFilterParams): Promise<NewsArticle[]> {
  const entries = await getCollection('news');
  let news = entries.map((e) => e.data as NewsArticle);

  // Filter out non-business/sports/crime dispatches from general news wires
  const noiseTerms = [
    'cristiano ronaldo',
    'futebol',
    'treino da selec',
    'estádio',
    'artilheiro',
    'copa do',
    'homicídio',
    'assassinat',
    'fotboll',
    'ishockey',
    'frölunda',
    'malmö ff',
    'krasch',
  ];
  news = news.filter((n) => {
    const text = `${n.title} ${n.summary}`.toLowerCase();
    return !noiseTerms.some((term) => text.includes(term));
  });

  // Sorting: 1) Date descending, 2) Business relevance (has companies/industries/topics), 3) fetchedAt descending
  news.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;

    const aScore = (a.featured ? 10 : 0) + (a.companies?.length || 0) * 3 + (a.industries?.length || 0) * 2 + (a.topics?.length || 0);
    const bScore = (b.featured ? 10 : 0) + (b.companies?.length || 0) * 3 + (b.industries?.length || 0) * 2 + (b.topics?.length || 0);
    if (bScore !== aScore) return bScore - aScore;

    if (b.fetchedAt && a.fetchedAt) {
      return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  if (!filters) return news;

  if (filters.country) {
    const c = filters.country.toLowerCase();
    news = news.filter((n) => n.countries.some((nc) => nc.toLowerCase() === c));
  }

  if (filters.industry) {
    const ind = filters.industry.toLowerCase();
    news = news.filter((n) => n.industries.some((ni) => ni.toLowerCase() === ind));
  }

  if (filters.topic) {
    const top = filters.topic.toLowerCase();
    news = news.filter((n) => n.topics.some((nt) => nt.toLowerCase() === top));
  }

  if (filters.company) {
    const comp = filters.company.toLowerCase();
    news = news.filter((n) => n.companies.some((nc) => nc.toLowerCase() === comp));
  }

  if (filters.skill) {
    const sk = filters.skill.toLowerCase();
    news = news.filter((n) => n.skills.some((ns) => ns.toLowerCase() === sk));
  }

  if (filters.role) {
    const r = filters.role.toLowerCase();
    news = news.filter((n) => n.roles.some((nr) => nr.toLowerCase() === r));
  }

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    news = news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.careerImpact.toLowerCase().includes(q)
    );
  }

  return news;
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | undefined> {
  const news = await getNews();
  return news.find((n) => n.slug.toLowerCase() === slug.toLowerCase() || n.id.toLowerCase() === slug.toLowerCase());
}

export async function getFeaturedNews(): Promise<NewsArticle[]> {
  const news = await getNews();
  return news.filter((n) => n.featured);
}

export async function getRecentNews(limit: number = 6): Promise<NewsArticle[]> {
  const news = await getNews();
  return news.slice(0, limit);
}

export async function getNewsByCountry(countrySlug: string): Promise<NewsArticle[]> {
  return getNews({ country: countrySlug });
}

export async function getNewsByIndustry(industrySlug: string): Promise<NewsArticle[]> {
  return getNews({ industry: industrySlug });
}

export async function getNewsByCompany(companySlug: string): Promise<NewsArticle[]> {
  return getNews({ company: companySlug });
}
