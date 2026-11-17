// Pure TypeScript – no Angular imports (also used by scripts/export-manifest.ts).
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'erwartet YYYY-MM-DD');
const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'erwartet ISO-Datum');

export const productSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.string(),
  asOf: isoDateTime,
  product: z.object({
    name: z.string(),
    isin: z.string(),
    wkn: z.string(),
    issuer: z.string(),
    category: z.string(),
    eusipaCode: z.number(),
    currency: z.string(),
    nominal: z.number(),
    issuePricePct: z.number(),
    capitalProtectionPct: z.number(),
    payoutPct: z.number(),
    payoutLevelPctOfStart: z.number(),
    participationPct: z.number().nullable().optional(),
    capPct: z.number().nullable().optional(),
    listings: z.array(z.string()),
    tax: z.string(),
    marketExpectation: z.string(),
    suitabilityText: z.string(),
    productUrl: z.string(),
  }),
  dates: z.object({
    firstValuation: isoDate,
    issue: isoDate,
    finalValuation: isoDate,
    maturity: isoDate,
  }),
  underlying: z.object({
    name: z.string(),
    shortName: z.string(),
    description: z.string(),
    currency: z.string(),
    startLevel: z.number(),
    decrementPct: z.number(),
  }),
  quote: z.object({
    /** Repayment (in %) if the index stayed at today's level until the final valuation day. */
    indicativeRedemptionPct: z.number().nullable().optional(),
    certificate: z.object({
      askPct: z.number(),
      bidPct: z.number(),
      timestamp: isoDateTime,
    }),
    underlying: z.object({
      last: z.number(),
      changePct: z.number(),
      timestamp: isoDateTime,
      delayed: z.boolean(),
    }),
  }),
  history: z
    .object({
      underlying: z.array(z.object({ date: isoDate, close: z.number() })),
    })
    .optional(),
  documents: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      date: isoDate.nullable().optional(),
    }),
  ),
});

export type ProductData = z.infer<typeof productSchema>;

/** Validates unknown JSON. Throws an Error with field path + reason on failure. */
export function parseProduct(json: unknown): ProductData {
  return parseWith(productSchema, json, 'Produktdaten');
}

export function parseWith<T>(schema: z.ZodType<T>, json: unknown, label: string): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`${label} ungültig – ${issues}`);
  }
  return result.data;
}
