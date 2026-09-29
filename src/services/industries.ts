import { getCollection } from 'astro:content';
import type { Industry } from '@/types';

export async function getIndustries(): Promise<Industry[]> {
  const entries = await getCollection('industries');
  return entries.map((e) => e.data as Industry);
}

export async function getFeaturedIndustries(): Promise<Industry[]> {
  const industries = await getIndustries();
  return industries.filter((i) => i.featured);
}

export async function getIndustryBySlug(slug: string): Promise<Industry | undefined> {
  const industries = await getIndustries();
  return industries.find((i) => i.slug.toLowerCase() === slug.toLowerCase() || i.id.toLowerCase() === slug.toLowerCase());
}
