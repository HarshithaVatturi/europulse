import { getCollection } from 'astro:content';
import type { Skill } from '@/types';
import { getJobs } from './jobs';

export async function getSkills(): Promise<Skill[]> {
  const entries = await getCollection('skills');
  return entries.map((e) => e.data as Skill);
}

export async function getSkillBySlug(slug: string): Promise<Skill | undefined> {
  const skills = await getSkills();
  return skills.find((s) => s.slug.toLowerCase() === slug.toLowerCase() || s.id.toLowerCase() === slug.toLowerCase());
}

/**
 * Derives top skills based on live frequency across active jobs.
 * Ensures every stat is derived from data, never hardcoded.
 */
export async function getTopSkillsFromJobs(limit: number = 8): Promise<Array<{ skill: Skill; count: number }>> {
  const [allSkills, allJobs] = await Promise.all([getSkills(), getJobs()]);
  const skillCountMap = new Map<string, number>();

  for (const job of allJobs) {
    for (const skillSlug of job.skills) {
      skillCountMap.set(skillSlug, (skillCountMap.get(skillSlug) || 0) + 1);
    }
  }

  const sorted = Array.from(skillCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const results: Array<{ skill: Skill; count: number }> = [];
  for (const [slug, count] of sorted) {
    const skill = allSkills.find((s) => s.slug === slug || s.id === slug);
    if (skill) {
      results.push({ skill, count });
    }
  }

  return results;
}
