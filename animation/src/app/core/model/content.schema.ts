// Pure TypeScript – no Angular imports.
import { z } from 'zod';
import { parseWith } from './product.schema';

const illustration = z.object({
  endPct: z.number(),
  path: z.array(z.number()).min(2),
});

const narration = z.union([
  z.null(),
  z.object({ text: z.string() }),
  z.object({ variantBy: z.string(), variants: z.record(z.string(), z.string()) }),
]);

export const contentSchema = z.object({
  schemaVersion: z.literal(1),
  locale: z.string(),
  global: z.object({
    brand: z.string(),
    adLabel: z.string(),
    footerNote: z.string(),
    asOfLabel: z.string(),
    fictionalLabel: z.string(),
  }),
  pronunciations: z.record(z.string(), z.string()),
  illustrations: z.object({ a: illustration, b: illustration }),
  slides: z.record(
    z.string(),
    z.object({
      screen: z.record(z.string(), z.unknown()),
      narration,
    }),
  ),
});

export type ContentData = z.infer<typeof contentSchema>;
export type SlideContent = ContentData['slides'][string];
export type Illustrations = ContentData['illustrations'];

export function parseContent(json: unknown): ContentData {
  return parseWith(contentSchema, json, 'Content');
}
