import { getCollection } from 'astro:content';
import type { Company } from '@/types';

export async function getCompanies(): Promise<Company[]> {
  const entries = await getCollection('companies');
  return entries.map((e) => e.data as Company);
}

export async function getFeaturedCompanies(): Promise<Company[]> {
  const companies = await getCompanies();
  return companies.filter((c) => c.featured);
}

export async function getCompanyBySlug(slug: string): Promise<Company | undefined> {
  const companies = await getCompanies();
  return companies.find((c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase());
}

export async function getCompaniesByCountry(countrySlug: string): Promise<Company[]> {
  const companies = await getCompanies();
  return companies.filter(
    (c) => c.country.toLowerCase() === countrySlug.toLowerCase() || c.operatingCountries.map((oc) => oc.toLowerCase()).includes(countrySlug.toLowerCase())
  );
}

export async function getCompaniesByIndustry(industrySlug: string): Promise<Company[]> {
  const companies = await getCompanies();
  return companies.filter((c) => c.industry.toLowerCase() === industrySlug.toLowerCase());
}
