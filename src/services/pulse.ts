import type { PulseEdition } from '@/types';

// Dynamically discover all pulse JSON files in ../data/pulse/
const pulseModules = import.meta.glob<{ default: PulseEdition }>('../data/pulse/*.json', { eager: true });

const editions: Record<string, PulseEdition> = {};

for (const [filePath, mod] of Object.entries(pulseModules)) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})\.json$/);
  if (match && mod && mod.default) {
    const dateStr = match[1];
    editions[dateStr] = mod.default as PulseEdition;
  }
}

// Sorted list of available dates, newest first
function getSortedDates(): string[] {
  return Object.keys(editions).sort().reverse();
}

export async function getPulseEdition(date?: string): Promise<PulseEdition | undefined> {
  if (date && editions[date]) {
    return editions[date];
  }
  const dates = getSortedDates();
  return dates.length > 0 ? editions[dates[0]] : undefined;
}

export async function getLatestPulseEdition(): Promise<PulseEdition> {
  const dates = getSortedDates();
  if (dates.length === 0) {
    throw new Error('No pulse editions found in src/data/pulse/');
  }
  return editions[dates[0]];
}

export async function getAllPulseDates(): Promise<string[]> {
  return getSortedDates();
}

