// Pure TypeScript – no Angular imports.
import { DEFAULT_LEAD_IN_MS, DEFAULT_TAIL_MS, type SlideMeta } from '../slide-meta';

export const S07_META: SlideMeta = {
  id: 's07-status',
  order: 7,
  title: 'Wo steht der Index heute?',
  durationMs: 19000,
  leadInMs: DEFAULT_LEAD_IN_MS,
  tailMs: DEFAULT_TAIL_MS,
  cues: { title: 200, axes: 300, line: 300, today: 3300, badge: 9000, zoomOut: 10700, note: 13100 },
  phaseMs: { axes: 600, line: 3000, today: 400, badge: 400, zoomOut: 2000, note: 400 },
};
