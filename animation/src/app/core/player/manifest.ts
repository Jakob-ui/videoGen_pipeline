// Pure TypeScript – the contract to the audio pipeline (AGENT.md §8.4).
// Used by window.videoApi.getManifest() AND by scripts/export-manifest.ts.
import type { ContentData } from '../model/content.schema';
import { buildContext } from '../model/context';
import type { ProductData } from '../model/product.schema';
import { pickNarration } from '../template/narration';
import { maxAudioMs, type SlideMeta } from '../../slides/slide-meta';

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

export interface ManifestSlide {
  id: string;
  order: number;
  route: string;
  startMs: number;
  durationMs: number;
  narration: null | {
    variant: string | null;
    spokenText: string;
    displayText: string;
    leadInMs: number;
    maxAudioMs: number;
    estimatedMs: number;
  };
}

export interface VideoManifest {
  schemaVersion: 1;
  generatedAt: string;
  dataSource: 'mock' | 'http';
  dataAsOf: string;
  width: number;
  height: number;
  fps: number;
  totalDurationMs: number;
  slides: ManifestSlide[];
}

export interface ManifestInput {
  metas: SlideMeta[];
  product: ProductData;
  content: ContentData;
  dataSource: 'mock' | 'http';
  /** ISO timestamp – passed in so the function itself stays deterministic. */
  generatedAt: string;
}

export function buildManifest(input: ManifestInput): VideoManifest {
  const { metas, product, content } = input;
  const ctx = buildContext(product, content);

  let startMs = 0;
  const slides: ManifestSlide[] = metas.map((meta) => {
    const slideContent = content.slides[meta.id];
    if (!slideContent) throw new Error(`content.de.json: Folie "${meta.id}" fehlt`);

    const narration = pickNarration(slideContent, ctx, content.pronunciations);
    const slide: ManifestSlide = {
      id: meta.id,
      order: meta.order,
      route: `/slides/${meta.id}`,
      startMs,
      durationMs: meta.durationMs,
      narration: narration && {
        ...narration,
        leadInMs: meta.leadInMs,
        maxAudioMs: maxAudioMs(meta),
      },
    };
    startMs += meta.durationMs;
    return slide;
  });

  return {
    schemaVersion: 1,
    generatedAt: input.generatedAt,
    dataSource: input.dataSource,
    dataAsOf: product.asOf,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    fps: VIDEO_FPS,
    totalDurationMs: startMs,
    slides,
  };
}
