// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S04_META: SlideMeta = {
  id: 's04-stichtag',
  order: 4,
  title: 'Der entscheidende Tag',
  durationMs: 9000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { zoom: 300, marker: 1900, question: 4500 },
  phaseMs: { zoom: 1200 },
};
