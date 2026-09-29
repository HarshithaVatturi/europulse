import type { PulseEdition } from '@/types';
import pulse20260929 from '@/data/pulse/2026-09-29.json';

const editions: Record<string, PulseEdition> = {
  '2026-09-29': pulse20260929 as PulseEdition,
};

export async function getPulseEdition(date: string = '2026-09-29'): Promise<PulseEdition | undefined> {
  return editions[date] || undefined;
}

export async function getLatestPulseEdition(): Promise<PulseEdition> {
  const dates = Object.keys(editions).sort().reverse();
  const latestDate = dates[0] || '2026-09-29';
  return editions[latestDate];
}

export async function getAllPulseDates(): Promise<string[]> {
  return Object.keys(editions).sort().reverse();
}
