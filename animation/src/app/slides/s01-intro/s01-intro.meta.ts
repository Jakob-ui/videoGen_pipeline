// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S01_META: SlideMeta = {
  id: 's01-intro',
  order: 1,
  title: 'Intro',
  durationMs: 9500,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { title: 300, pill: 900, subtitle: 1500, iconsBg: 600 },
};
