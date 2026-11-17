// Pure TypeScript – maps data context + resolved screen texts to chart view models.
// Only picks values; all business logic lives in core/model/derive.ts.
import type { TemplateContext } from '../model/context';
import { dayToMs } from '../model/dates';
import type { ExamplesVm } from './options/examples.option';
import type { PayoffVm } from './options/payoff.option';
import type { StatusVm } from './options/status.option';
import type { Point } from './reveal';

type Texts = Record<string, string>;

export function payoffVm(ctx: TemplateContext, s: Texts): PayoffVm {
  return {
    protectionPct: ctx.product.capitalProtectionPct,
    payoutPct: ctx.product.capPct ?? ctx.product.payoutPct,
    protectionIndexPct: ctx.derived.protectionIndexPct,
    maxIndexPct: ctx.derived.maxIndexPct,
    xAxisName: s['xAxis'],
    yAxisName: s['yAxis'],
    startLine: s['startLine'],
    upperLabel: s['upperLabel'],
    lowerLabel: s['lowerLabel'],
    midLabel: s['midLabel'],
  };
}

export function examplesVm(ctx: TemplateContext, s: Texts): ExamplesVm {
  return {
    termYears: ctx.derived.termYears,
    pathA: ctx.illustrations.a.path,
    pathB: ctx.illustrations.b.path,
    labelA: s['labelA'],
    resultA: s['resultA'],
    labelB: s['labelB'],
    resultB: s['resultB'],
    startLabel: s['startLabel'],
    durationLabel: s['durationLabel'],
  };
}

export function statusVm(ctx: TemplateContext, s: Texts): StatusVm {
  const history = ctx.history?.underlying;
  const toPct = (level: number) => (level / ctx.derived.start - 1) * 100;
  return {
    lastPct: ctx.derived.distancePct,
    zone: ctx.derived.zone,
    protectionIndexPct: ctx.derived.protectionIndexPct,
    maxIndexPct: ctx.derived.maxIndexPct,
    firstValuationMs: dayToMs(ctx.dates.firstValuation),
    asOfMs: dayToMs(ctx.derived.asOfDay),
    finalValuationMs: dayToMs(ctx.dates.finalValuation),
    yMin: ctx.derived.statusYBand.min,
    yMax: ctx.derived.statusYBand.max,
    history: history?.length ? history.map((p): Point => [dayToMs(p.date), toPct(p.close)]) : null,
    startLine: s['startLine'],
    todayLabel: s['todayLabel'],
    distanceBadge: s['distanceBadge'],
    zoneMax: s['zoneMax'],
    zoneMid: s['zoneMid'],
    zoneLower: s['zoneLower'],
    finalValuationLabel: s['finalValuationLabel'],
    remaining: s['remaining'],
  };
}
