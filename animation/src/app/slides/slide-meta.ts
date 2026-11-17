// Pure TypeScript – no Angular imports.

export interface SlideMeta {
  /** Key in content.de.json and route segment, e.g. 's05-auszahlungsprofil'. */
  id: string;
  order: number;
  /** Only for overview/logs. */
  title: string;
  /** FIXED duration of the slide. */
  durationMs: number;
  /** Audio starts this long after the slide start. */
  leadInMs: number;
  /** Silence at the end of the slide. */
  tailMs: number;
  /** Animation start times in ms from slide start. */
  cues: Record<string, number>;
  /** Optional lengths of chart/draw phases that start at the cue of the same name. */
  phaseMs?: Record<string, number>;
}

export const DEFAULT_LEAD_IN_MS = 500;
export const DEFAULT_TAIL_MS = 1000;
/** Content fades in/out during this time at the start/end of every slide. */
export const SLIDE_FADE_MS = 400;

export function maxAudioMs(meta: SlideMeta): number {
  return meta.durationMs - meta.leadInMs - meta.tailMs;
}
