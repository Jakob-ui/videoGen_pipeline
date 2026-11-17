// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S13_META: SlideMeta = {
  id: 's13-outro',
  order: 12,
  title: 'Outro',
  durationMs: 3000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { logo: 0 },
  phaseMs: { logo: 800 },
};
