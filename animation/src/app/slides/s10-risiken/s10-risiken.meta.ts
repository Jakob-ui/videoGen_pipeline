// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S10_META: SlideMeta = {
  id: 's10-risiken',
  order: 9,
  title: 'Chancen und Risiken',
  durationMs: 13000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { chances: 500, risks: 2100, risk0: 2100, risk1: 4500, risk2: 8100, risk3: 10600, risk4: 11000 },
};
