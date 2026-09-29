import { getCollection } from 'astro:content';
import type { Country, MacroIndicators } from '@/types';
import indicatorsData from '@/data/macro/indicators.json';

export async function getCountries(): Promise<Country[]> {
  const entries = await getCollection('countries');
  return entries.map((e) => e.data as Country);
}

export async function getFeaturedCountries(): Promise<Country[]> {
  const countries = await getCountries();
  return countries.filter((c) => c.featured);
}

export async function getCountryBySlug(slug: string): Promise<Country | undefined> {
  const countries = await getCountries();
  return countries.find((c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase());
}

export async function getCountryByIso2(iso2: string): Promise<Country | undefined> {
  const countries = await getCountries();
  return countries.find((c) => c.iso2.toLowerCase() === iso2.toLowerCase());
}

export function getCountryMacroIndicators(iso2: string): MacroIndicators | null {
  try {
    const record = (indicatorsData as Record<string, MacroIndicators>)[iso2.toUpperCase()];
    return record || null;
  } catch {
    return null;
  }
}

