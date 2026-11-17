// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S08_META: SlideMeta = {
  id: 's08-rendite',
  order: 8,
  title: 'Aktueller Kaufkurs',
  durationMs: 12500,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { price: 300, warning: 5400 },
};
