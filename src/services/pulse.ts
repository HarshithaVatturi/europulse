import type { PulseEdition } from '@/types';

// Dynamically discover all pulse JSON files in @/data/pulse/
const pulseModules = import.meta.glob<{ default: PulseEdition }>('@/data/pulse/*.json', { eager: true });

const editions: Record<string, PulseEdition> = {};

for (const [filePath, mod] of Object.entries(pulseModules)) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})\.json$/);
  if (match) {
    const dateStr = match[1];
    editions[dateStr] = mod.default;
  }
}

export async function getPulseEdition(date?: string): Promise<PulseEdition | undefined> {
  if (date && editions[date]) {
    return editions[date];
  }
  const dates = Object.keys(editions).sort().reverse();
  const latestDate = dates[0] || '2026-09-29';
  return editions[latestDate];
}

export async function getLatestPulseEdition(): Promise<PulseEdition> {
  const dates = Object.keys(editions).sort().reverse();
  const latestDate = dates[0] || '2026-09-29';
  return editions[latestDate];
}

export async function getAllPulseDates(): Promise<string[]> {
  return Object.keys(editions).sort().reverse();
}

