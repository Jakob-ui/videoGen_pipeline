// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S06_META: SlideMeta = {
  id: 's06-beispiele',
  order: 6,
  title: 'Zwei Beispiele',
  durationMs: 13000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { axes: 300, pathA: 2100, resultA: 5000, dimA: 6800, pathB: 6800, resultB: 9300 },
  phaseMs: { axes: 600, pathA: 2500, resultA: 400, dimA: 600, pathB: 2500, resultB: 400 },
};
