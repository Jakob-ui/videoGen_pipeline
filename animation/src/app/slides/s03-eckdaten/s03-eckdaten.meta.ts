// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S03_META: SlideMeta = {
  id: 's03-eckdaten',
  order: 3,
  title: 'Eckdaten',
  durationMs: 17000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { title: 200, underlying: 500, description: 5500, timeline: 8400, endMarker: 12500 },
  phaseMs: { timeline: 1500 },
};
