import { getCollection } from 'astro:content';
import type { Startup } from '@/types';

export async function getStartups(): Promise<Startup[]> {
  const entries = await getCollection('startups');
  return entries.map((e) => e.data as Startup);
}

export async function getStartupsByCountry(countrySlug: string): Promise<Startup[]> {
  const startups = await getStartups();
  return startups.filter((s) => s.country.toLowerCase() === countrySlug.toLowerCase());
}

export async function getStartupsByIndustry(industrySlug: string): Promise<Startup[]> {
  const startups = await getStartups();
  return startups.filter((s) => s.industry.toLowerCase() === industrySlug.toLowerCase());
}
