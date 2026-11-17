// Pure TypeScript – the ONLY place with business logic (AGENT.md §5.2).
import type { Illustrations } from './content.schema';
import { daysBetween, viennaDay } from './dates';
import type { ProductData } from './product.schema';

export type Position = 'ueber' | 'auf' | 'unter';

/** Payout zone for an index change: capital protection, 1:1 participation, or maximum payout. */
export type Zone = 'schutz' | 'teilnahme' | 'max';

/** Example investment in EUR used for "also X Euro je 100 Euro". */
export const EXAMPLE_INVESTMENT_EUR = 100;

export interface DerivedValues {
  asOfDay: string;
  start: number;
  last: number;
  /** Index change vs. start level in %. */
  distancePct: number;
  /** Position vs. the start level (wording "über/auf/unter dem Startwert"). */
  position: Position;
  /** Zone the index is in today. */
  zone: Zone;
  /** Index change (in %) from which the maximum payout is reached. */
  maxIndexPct: number;
  /** Index change (in %) below which the capital protection applies. */
  protectionIndexPct: number;
  /** Repayment if the index stayed at today's level (from the JSON, otherwise computed). */
  indicativeRedemptionPct: number;
  daysToMaturity: number;
  yearsToMaturity: number;
  termYears: number;
  example: { investment: number; payoutAmount: number; protectionAmount: number };
  illustrations: { a: { payoutPct: number }; b: { payoutPct: number } };
  /** Fixed y-range (index change in %) of the "index today" chart (§7.5.3). */
  statusYBand: { min: number; max: number; halfPct: number };
}

/** Index distance (in %) below which we say "auf dem Startwert". */
const ON_START_TOLERANCE_PCT = 0.25;

type Product = ProductData['product'];

/** Upper repayment limit in %. */
function maxPayoutPct(product: Product): number {
  return product.capPct ?? product.payoutPct;
}

/** Index change (in %) at which the maximum payout is reached. */
export function maxIndexPct(product: Product): number {
  return product.payoutLevelPctOfStart - 100;
}

/** Index change (in %) below which only the capital protection is paid. */
export function protectionIndexPct(product: Product): number {
  const participation = product.participationPct;
  if (!participation) return maxIndexPct(product); // digital payout: one threshold
  return ((product.capitalProtectionPct - 100) * 100) / participation;
}

/** Repayment (in %) for a given index change at the final valuation day. */
export function payoffAt(product: Product, endPct: number): number {
  const participation = product.participationPct;
  if (!participation) {
    // digital: "auf oder über der Schwelle" → >=
    return endPct >= maxIndexPct(product) ? product.payoutPct : product.capitalProtectionPct;
  }
  const linear = 100 + (endPct * participation) / 100;
  return Math.min(maxPayoutPct(product), Math.max(product.capitalProtectionPct, linear));
}

export function zoneAt(product: Product, endPct: number): Zone {
  if (endPct >= maxIndexPct(product)) return 'max';
  if (endPct < protectionIndexPct(product)) return 'schutz';
  return 'teilnahme';
}

/** Symmetric y-band (index change in %) around the start level, growing in fixed 5 % steps. */
export function statusYBand(data: ProductData): DerivedValues['statusYBand'] {
  const start = data.underlying.startLevel;
  const levels = [...(data.history?.underlying ?? []).map((p) => p.close), data.quote.underlying.last];
  const maxDev = Math.max(...levels.map((v) => Math.abs((v / start - 1) * 100)));
  const halfPct = Math.max(10, Math.ceil(maxDev / 5) * 5 + 5);
  return { min: -halfPct, max: halfPct, halfPct };
}

export function derive(data: ProductData, illustrations: Illustrations): DerivedValues {
  const { product, dates, underlying, quote } = data;

  const asOfDay = viennaDay(data.asOf);
  const start = underlying.startLevel;
  const last = quote.underlying.last;
  const distancePct = (last / start - 1) * 100;

  let position: Position;
  if (Math.abs(distancePct) < ON_START_TOLERANCE_PCT) position = 'auf';
  else position = distancePct > 0 ? 'ueber' : 'unter';

  const daysToMaturity = daysBetween(asOfDay, dates.maturity);
  const toEur = (pct: number) => (EXAMPLE_INVESTMENT_EUR * pct) / 100;

  return {
    asOfDay,
    start,
    last,
    distancePct,
    position,
    zone: zoneAt(product, distancePct),
    maxIndexPct: maxIndexPct(product),
    protectionIndexPct: protectionIndexPct(product),
    indicativeRedemptionPct: quote.indicativeRedemptionPct ?? payoffAt(product, distancePct),
    daysToMaturity,
    yearsToMaturity: daysToMaturity / 365,
    termYears: Math.round(daysBetween(dates.issue, dates.maturity) / 365),
    example: {
      investment: EXAMPLE_INVESTMENT_EUR,
      payoutAmount: toEur(maxPayoutPct(product)),
      protectionAmount: toEur(product.capitalProtectionPct),
    },
    illustrations: {
      a: { payoutPct: payoffAt(product, illustrations.a.endPct) },
      b: { payoutPct: payoffAt(product, illustrations.b.endPct) },
    },
    statusYBand: statusYBand(data),
  };
}
