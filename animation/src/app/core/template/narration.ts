// Pure TypeScript – picks and resolves the narration of one slide (AGENT.md §6.4).
import type { SlideContent } from '../model/content.schema';
import { applyPronunciations, getPath, resolve } from './template';

/** Conservative speaking rate for German TTS. Calibrate after the first real TTS run. */
export const CHARS_PER_SECOND = 15;

export interface Narration {
  variant: string | null;
  displayText: string;
  spokenText: string;
  estimatedMs: number;
}

/** The raw (unresolved) narration text for a given variant, or all variants. */
export function narrationTexts(slide: SlideContent): Record<string, string> {
  const n = slide.narration;
  if (n === null) return {};
  if ('text' in n) return { default: n.text };
  return n.variants;
}

export function pickNarration(
  slide: SlideContent,
  ctx: unknown,
  pronunciations: Record<string, string>,
  forceVariant?: string,
): Narration | null {
  const n = slide.narration;
  if (n === null) return null;

  let variant: string | null = null;
  let text: string;
  if ('text' in n) {
    text = n.text;
  } else {
    variant = forceVariant ?? String(getPath(ctx, n.variantBy));
    const variantText = n.variants[variant];
    if (variantText === undefined) {
      throw new Error(`Variante "${variant}" fehlt für ${n.variantBy}`);
    }
    text = variantText;
  }

  const spokenText = applyPronunciations(resolve(text, ctx, 'spoken'), pronunciations);
  return {
    variant,
    displayText: resolve(text, ctx, 'display'),
    spokenText,
    estimatedMs: Math.round((spokenText.length / CHARS_PER_SECOND) * 1000),
  };
}
