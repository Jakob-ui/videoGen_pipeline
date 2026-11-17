// Pure TypeScript – Graph 3: where is the index today? (AGENT.md §7.5.3)
// Everything in % change vs. the start level – no index points.
import { addDays } from '../../model/dates';
import type { Zone } from '../../model/derive';
import { lerp } from '../../player/timing';
import { FORMATTERS } from '../../template/formatters';
import { revealSeries, type Point } from '../reveal';
import { RZ_COLORS, RZ_SIZES, withAlpha } from '../rz-echarts-theme';

export interface StatusVm {
  /** Index change today in %. */
  lastPct: number;
  zone: Zone;
  protectionIndexPct: number;
  maxIndexPct: number;
  /** All dates as UTC-midnight milliseconds. */
  firstValuationMs: number;
  asOfMs: number;
  finalValuationMs: number;
  yMin: number;
  yMax: number;
  /** [date, change in %]; null → no history delivered: simplified dashed line, never invented prices. */
  history: Point[] | null;
  startLine: string;
  todayLabel: string;
  distanceBadge: string;
  zoneMax: string;
  zoneMid: string;
  zoneLower: string;
  finalValuationLabel: string;
  remaining: string;
}

export interface StatusState {
  axes: number;
  line: number;
  today: number;
  badge: number;
  /** Already eased (ease-in-out) 0..1. */
  zoomOut: number;
}

export const STATUS_SIZE = { width: 1500, height: 660 };

const monthFormat = new Intl.DateTimeFormat('de-AT', { month: 'short', timeZone: 'UTC' });
const yearFormat = new Intl.DateTimeFormat('de-AT', { year: 'numeric', timeZone: 'UTC' });

export function buildStatusOption(vm: StatusVm, p: StatusState) {
  const axisColor = withAlpha(RZ_COLORS.grey, p.axes);
  const textColor = withAlpha(RZ_COLORS.text, p.axes);
  const xMax = lerp(addDays(vm.asOfMs, 14), vm.finalValuationMs, p.zoomOut);
  const badgeColor = vm.zone === 'schutz' ? RZ_COLORS.greyLight : RZ_COLORS.yellow;
  // Before the zoom-out the point sits at the right edge (label above it); afterwards near the left edge (label to the right).
  const labelRight = p.zoomOut >= 0.5;
  const labelAlign = labelRight ? 'left' : 'center';

  // Zones clipped to the visible y-band; the active one is highlighted.
  const clamp = (v: number) => Math.min(vm.yMax, Math.max(vm.yMin, v));
  const zones: { id: Zone; from: number; to: number; text: string; color: string }[] = [
    { id: 'schutz', from: vm.yMin, to: clamp(vm.protectionIndexPct), text: vm.zoneLower, color: RZ_COLORS.grey },
    { id: 'teilnahme', from: clamp(vm.protectionIndexPct), to: clamp(vm.maxIndexPct), text: vm.zoneMid, color: RZ_COLORS.blue },
    { id: 'max', from: clamp(vm.maxIndexPct), to: vm.yMax, text: vm.zoneMax, color: RZ_COLORS.yellow },
  ];
  const zoneAreas = zones
    .filter((z) => z.to > z.from)
    .map((z) => [
      {
        yAxis: z.from,
        itemStyle: { color: withAlpha(z.color, (z.id === vm.zone ? 0.2 : 0.06) * p.axes) },
        // Protection label sits at the bottom so it never collides with the "today" label.
        label: { formatter: z.text, color: textColor, position: z.id === 'schutz' ? 'insideBottomLeft' : 'insideTopLeft' },
      },
      { yAxis: z.to },
    ]);

  const line = vm.history
    ? {
        id: 'history',
        type: 'line',
        symbol: 'none',
        data: revealSeries(vm.history, p.line),
        lineStyle: { width: 8, cap: 'round', join: 'round', color: RZ_COLORS.blue },
      }
    : {
        id: 'simplified',
        type: 'line',
        symbol: 'none',
        data: revealSeries([[vm.firstValuationMs, 0], [vm.asOfMs, vm.lastPct]], p.line),
        lineStyle: { width: 6, type: 'dashed', color: RZ_COLORS.blue },
      };

  return {
    animation: false,
    grid: { left: 140, right: 70, top: 50, bottom: 70 },
    xAxis: {
      type: 'time',
      min: vm.firstValuationMs,
      max: xMax,
      splitNumber: 6,
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: {
        color: textColor,
        hideOverlap: true,
        formatter: (v: number) => (p.zoomOut < 0.5 ? monthFormat : yearFormat).format(new Date(v)),
      },
    },
    yAxis: {
      type: 'value',
      min: vm.yMin,
      max: vm.yMax,
      interval: 5,
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: { color: textColor, formatter: (v: number) => FORMATTERS['pctSigned'](v, 'display') },
    },
    series: [
      {
        id: 'zones',
        type: 'line',
        data: [],
        markArea: {
          silent: true,
          label: { fontSize: RZ_SIZES.axisLabel, position: 'insideTopLeft', distance: 16 },
          data: zoneAreas,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: RZ_SIZES.helperLine, color: axisColor },
          data: [
            {
              yAxis: 0,
              label: { formatter: vm.startLine, position: 'insideEndBottom', distance: [60, 10], color: textColor, fontSize: RZ_SIZES.axisLabel },
            },
          ],
        },
      },
      {
        id: 'future',
        type: 'line',
        data: [],
        markArea: {
          silent: true,
          itemStyle: {
            color: withAlpha(RZ_COLORS.greyLight, 0.6 * p.zoomOut),
            decal: {
              symbol: 'rect',
              color: withAlpha(RZ_COLORS.grey, 0.25 * p.zoomOut),
              dashArrayX: [1, 0],
              dashArrayY: [3, 9],
              rotation: -Math.PI / 4,
            },
          },
          label: {
            formatter: vm.remaining,
            position: 'insideTop',
            distance: 70,
            fontSize: RZ_SIZES.label,
            fontWeight: 600,
            color: withAlpha(RZ_COLORS.text, p.zoomOut),
          },
          data: [[{ xAxis: vm.asOfMs }, { xAxis: vm.finalValuationMs }]],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 3, color: withAlpha(RZ_COLORS.text, p.zoomOut) },
          data: [
            {
              xAxis: vm.finalValuationMs,
              label: {
                formatter: vm.finalValuationLabel,
                position: 'insideEndTop',
                fontSize: RZ_SIZES.axisLabel,
                color: withAlpha(RZ_COLORS.text, p.zoomOut),
              },
            },
          ],
        },
      },
      line,
      {
        id: 'today',
        type: 'scatter',
        z: 10,
        data: [
          {
            value: [vm.asOfMs, vm.lastPct],
            symbolSize: p.today > 0 ? RZ_SIZES.marker : 0,
            itemStyle: { color: RZ_COLORS.yellow, borderColor: RZ_COLORS.text, borderWidth: 4 },
            label: {
              show: true,
              position: labelRight ? 'right' : 'top',
              distance: labelRight ? 28 : 18,
              formatter: `{today|${vm.todayLabel}}\n{badge|${vm.distanceBadge}}`,
              rich: {
                today: {
                  fontSize: RZ_SIZES.label,
                  fontWeight: 600,
                  color: withAlpha(RZ_COLORS.text, p.today),
                  align: labelAlign,
                  lineHeight: 40,
                },
                badge: {
                  fontSize: RZ_SIZES.axisLabel,
                  color: withAlpha(RZ_COLORS.text, p.badge),
                  backgroundColor: withAlpha(badgeColor, p.badge),
                  borderRadius: 20,
                  padding: [8, 16],
                  align: labelAlign,
                },
              },
            },
          },
        ],
      },
    ],
  };
}
