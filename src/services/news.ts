import { getCollection } from 'astro:content';
import type { NewsArticle, NewsFilterParams } from '@/types';

export async function getNews(filters?: NewsFilterParams): Promise<NewsArticle[]> {
  const entries = await getCollection('news');
  let news = entries.map((e) => e.data as NewsArticle);

  // Default sorting: descending by date
  news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
