// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S11_META: SlideMeta = {
  id: 's11-cta',
  order: 10,
  title: 'Call to Action',
  durationMs: 8500,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { title: 300, url: 1200, isin: 2000, docs: 2600 },
};
