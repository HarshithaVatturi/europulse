import type { PulseEdition } from '@/types';
import fallbackEdition from '../data/pulse/2026-09-29.json';

// Dynamically discover all pulse JSON files in ../data/pulse/
const pulseModules = import.meta.glob<{ default: PulseEdition }>('../data/pulse/*.json', { eager: true });

const editions: Record<string, PulseEdition> = {
  '2026-09-29': fallbackEdition as unknown as PulseEdition,
};

for (const [filePath, mod] of Object.entries(pulseModules)) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})\.json$/);
  if (match && mod && mod.default) {
    const dateStr = match[1];
    editions[dateStr] = mod.default as PulseEdition;
  }
}

export async function getPulseEdition(date?: string): Promise<PulseEdition | undefined> {
  if (date && editions[date]) {
    return editions[date];
  }
  const dates = Object.keys(editions).sort().reverse();
  const latestDate = dates[0] || '2026-09-29';
  return editions[latestDate] || (fallbackEdition as unknown as PulseEdition);
}

export async function getLatestPulseEdition(): Promise<PulseEdition> {
  const dates = Object.keys(editions).sort().reverse();
  const latestDate = dates[0] || '2026-09-29';
  return editions[latestDate] || (fallbackEdition as unknown as PulseEdition);
}

export async function getAllPulseDates(): Promise<string[]> {
  const dates = Object.keys(editions).sort().reverse();
  return dates.length > 0 ? dates : ['2026-09-29'];
}

