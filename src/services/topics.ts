import { getCollection } from 'astro:content';
import type { Topic } from '@/types';

export async function getTopics(): Promise<Topic[]> {
  const entries = await getCollection('topics');
  return entries.map((e) => e.data as Topic);
}

export async function getTopicBySlug(slug: string): Promise<Topic | undefined> {
  const topics = await getTopics();
  return topics.find((t) => t.slug.toLowerCase() === slug.toLowerCase() || t.id.toLowerCase() === slug.toLowerCase());
}
