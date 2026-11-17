// Pure TypeScript – turns slide time t (ms) into animation progress 0..1.
import type { SlideMeta } from '../../slides/slide-meta';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Ease-out cubic (calm, like the CSS motion curve). */
export const easeOut = (x: number) => 1 - (1 - x) ** 3;

export const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** Linear progress of a phase that starts at `startMs` and lasts `durationMs`. */
export function linearProgress(t: number, startMs: number, durationMs: number): number {
  if (durationMs <= 0) return t >= startMs ? 1 : 0;
  return clamp01((t - startMs) / durationMs);
}

/**
 * Eased progress for every cue of a slide:
 * phases(meta, t).upper === ease(clamp((t - cues.upper) / phaseMs.upper)).
 * Cues without a phase length jump from 0 to 1 at their cue.
 */
export function phases<T = Record<string, number>>(
  meta: SlideMeta,
  t: number,
  easings: Record<string, (x: number) => number> = {},
): T {
  const result: Record<string, number> = {};
  for (const [name, cue] of Object.entries(meta.cues)) {
    const ease = easings[name] ?? easeOut;
    result[name] = ease(linearProgress(t, cue, meta.phaseMs?.[name] ?? 0));
  }
  return result as T;
}
