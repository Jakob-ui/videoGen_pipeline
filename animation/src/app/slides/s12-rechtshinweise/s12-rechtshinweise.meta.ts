// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S12_META: SlideMeta = {
  id: 's12-rechtshinweise',
  order: 11,
  title: 'Rechtshinweise',
  durationMs: 20000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { page0: 0, page1: 10000 },
};
