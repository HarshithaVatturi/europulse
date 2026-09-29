import { getCollection } from 'astro:content';
import type { Degree } from '@/types';

export async function getDegrees(): Promise<Degree[]> {
  const entries = await getCollection('degrees');
  return entries.map((e) => e.data as Degree);
}

export async function getDegreeBySlug(slug: string): Promise<Degree | undefined> {
  const degrees = await getDegrees();
  return degrees.find((d) => d.slug.toLowerCase() === slug.toLowerCase() || d.id.toLowerCase() === slug.toLowerCase());
}
