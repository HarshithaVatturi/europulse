import { getCollection } from 'astro:content';
import type { Job, JobFilterParams } from '@/types';

export async function getJobs(filters?: JobFilterParams): Promise<Job[]> {
  const entries = await getCollection('jobs');
  let jobs = entries.map((e) => e.data as Job);

  if (!filters) return jobs;

  if (filters.country) {
    const c = filters.country.toLowerCase();
    jobs = jobs.filter((j) => j.country.toLowerCase() === c);
  }

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    jobs = jobs.filter((j) => j.city.toLowerCase().includes(cityLower));
  }

  if (filters.industry) {
    const ind = filters.industry.toLowerCase();
    jobs = jobs.filter((j) => j.industry.toLowerCase() === ind);
  }

  if (filters.function) {
    const fn = filters.function.toLowerCase();
    jobs = jobs.filter((j) => j.function.toLowerCase() === fn);
  }

  if (filters.degree) {
    const deg = filters.degree.toLowerCase();
    jobs = jobs.filter((j) => j.degrees.some((d) => d.toLowerCase() === deg));
  }

  if (filters.experience) {
    const exp = filters.experience.toLowerCase();
    jobs = jobs.filter((j) => j.experience.toLowerCase() === exp);
  }

  if (filters.employmentType) {
    const emp = filters.employmentType.toLowerCase();
    jobs = jobs.filter((j) => j.employmentType.toLowerCase() === emp);
  }

  if (filters.workMode) {
    const wm = filters.workMode.toLowerCase();
    jobs = jobs.filter((j) => j.workMode.toLowerCase() === wm);
  }

  if (filters.language) {
    const lang = filters.language.toLowerCase();
    jobs = jobs.filter((j) => j.languages.some((l) => l.toLowerCase() === lang));
  }

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.city.toLowerCase().includes(q) ||
        j.industry.toLowerCase().includes(q) ||
        j.function.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  return jobs;
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const jobs = await getJobs();
  return jobs.find((j) => j.slug.toLowerCase() === slug.toLowerCase() || j.id.toLowerCase() === slug.toLowerCase());
}

export async function getFeaturedJobs(): Promise<Job[]> {
  const jobs = await getJobs();
  return jobs.filter((j) => j.featured);
}

export async function getJobsPostedOnDate(date: string = '2026-09-29'): Promise<Job[]> {
  const jobs = await getJobs();
  return jobs.filter((j) => j.postedDate === date);
}

/**
 * Computes live hiring activity distribution by country for the Pulse briefing and maps.
 */
export async function getHiringByCountry(date?: string): Promise<Array<{ countrySlug: string; count: number }>> {
  const jobs = date ? await getJobsPostedOnDate(date) : await getJobs();
  const counts = new Map<string, number>();

  for (const job of jobs) {
    counts.set(job.country, (counts.get(job.country) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([countrySlug, count]) => ({ countrySlug, count }))
    .sort((a, b) => b.count - a.count);
}
