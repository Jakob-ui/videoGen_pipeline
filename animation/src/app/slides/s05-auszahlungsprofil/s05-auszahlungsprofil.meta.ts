// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S05_META: SlideMeta = {
  id: 's05-auszahlungsprofil',
  order: 5,
  title: 'Auszahlungsprofil',
  durationMs: 22500,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { axes: 300, upper: 600, upperLabel: 5000, lower: 9900, lowerLabel: 14600, mid: 18000, midLabel: 19000 },
  phaseMs: { axes: 600, upper: 1200, upperLabel: 400, lower: 1200, lowerLabel: 400, mid: 1500, midLabel: 400 },
};
