import { getCollection } from 'astro:content';
import type { LabEntry } from '@/types';

export async function getLabEntries(): Promise<LabEntry[]> {
  const entries = await getCollection('lab');
  const isProd = import.meta.env.PROD;

  const validEntries = entries
    .filter((e) => !isProd || !e.data.draft)
    .map((e) => ({
      slug: e.id.replace(/\.md$/, ''),
      title: e.data.title,
      type: e.data.type,
      status: e.data.status,
      date: e.data.date,
      tags: e.data.tags,
      links: e.data.links,
      draft: e.data.draft,
      summary: e.data.summary,
      body: e.body,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return validEntries;
}

export async function getLabEntryBySlug(slug: string): Promise<LabEntry | undefined> {
  const entries = await getLabEntries();
  return entries.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}
