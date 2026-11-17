// Pure TypeScript – Graph 1: payout profile (AGENT.md §7.5.1).
// Protection floor → 1:1 participation → cap.
import { FORMATTERS } from '../../template/formatters';
import { revealSeries } from '../reveal';
import { RZ_COLORS, RZ_SIZES, withAlpha } from '../rz-echarts-theme';

export interface PayoffVm {
  protectionPct: number;
  payoutPct: number;
  /** Index change (%) where the protection floor ends. */
  protectionIndexPct: number;
  /** Index change (%) where the maximum payout starts. */
  maxIndexPct: number;
  xAxisName: string;
  yAxisName: string;
  startLine: string;
  upperLabel: string;
  lowerLabel: string;
  midLabel: string;
}

/** Progress 0..1 of each animation phase. */
export interface PayoffState {
  axes: number;
  upper: number;
  upperLabel: number;
  lower: number;
  lowerLabel: number;
  mid: number;
  midLabel: number;
}

export const PAYOFF_SIZE = { width: 1500, height: 640 };

const X_MIN = -30;
const X_MAX = 50;

export function buildPayoffOption(vm: PayoffVm, p: PayoffState) {
  const { protectionPct: low, payoutPct: high, protectionIndexPct: xLow, maxIndexPct: xHigh } = vm;
  const axisColor = withAlpha(RZ_COLORS.grey, p.axes);
  const textColor = withAlpha(RZ_COLORS.text, p.axes);
  const mainLine = { width: RZ_SIZES.mainLine, color: RZ_COLORS.blue, cap: 'round', join: 'round' };
  const label = (opacity: number) => ({ fontSize: RZ_SIZES.label, fontWeight: 600, color: withAlpha(RZ_COLORS.text, opacity) });

  return {
    animation: false,
    grid: { left: 150, right: 80, top: 70, bottom: 110 },
    xAxis: {
      type: 'value',
      min: X_MIN,
      max: X_MAX,
      interval: 10,
      name: vm.xAxisName,
      nameLocation: 'middle',
      nameGap: 60,
      nameTextStyle: { color: textColor },
      axisLine: { onZero: false, lineStyle: { color: axisColor } },
      axisLabel: { color: textColor, formatter: (v: number) => FORMATTERS['pctSigned'](v, 'display') },
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 140,
      name: vm.yAxisName,
      nameTextStyle: { color: textColor, align: 'left' },
      axisLine: { onZero: false, lineStyle: { color: axisColor } },
      axisLabel: {
        color: textColor,
        customValues: [100, low, high],
        formatter: (v: number) => FORMATTERS['pct'](v, 'display'),
      },
    },
    series: [
      {
        id: 'upper',
        type: 'line',
        data: revealSeries([[xHigh, high], [X_MAX, high]], p.upper),
        lineStyle: mainLine,
        symbol: 'none',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: RZ_SIZES.helperLine, color: axisColor },
          label: { color: textColor, fontSize: RZ_SIZES.axisLabel },
          data: [
            { xAxis: 0, label: { formatter: vm.startLine, position: 'end' } },
            { yAxis: 100, label: { show: false } },
          ],
        },
      },
      {
        id: 'lower',
        type: 'line',
        data: revealSeries([[xLow, low], [X_MIN, low]], p.lower),
        lineStyle: mainLine,
        symbol: 'none',
      },
      {
        id: 'mid',
        type: 'line',
        data: revealSeries([[xLow, low], [xHigh, high]], p.mid),
        lineStyle: mainLine,
        symbol: 'none',
      },
      {
        id: 'dots',
        type: 'scatter',
        z: 5,
        data: [
          {
            value: [xHigh, high],
            symbolSize: p.upper > 0 ? RZ_SIZES.marker : 0,
            itemStyle: { color: RZ_COLORS.yellow, borderColor: RZ_COLORS.text, borderWidth: 3 },
          },
          {
            value: [xLow, low],
            symbolSize: p.lower > 0 ? RZ_SIZES.marker : 0,
            itemStyle: { color: RZ_COLORS.white, borderColor: RZ_COLORS.yellow, borderWidth: 6 },
          },
        ],
      },
      {
        id: 'labels',
        type: 'scatter',
        symbolSize: 0,
        silent: true,
        data: [
          {
            value: [(xHigh + X_MAX) / 2, high],
            label: { show: true, formatter: vm.upperLabel, position: 'top', distance: 18, ...label(p.upperLabel) },
          },
          {
            value: [(X_MIN + xLow) / 2, low],
            label: { show: true, formatter: vm.lowerLabel, position: 'top', distance: 18, ...label(p.lowerLabel) },
          },
          {
            value: [(xLow + xHigh) / 2, (low + high) / 2],
            label: { show: true, formatter: vm.midLabel, position: 'right', distance: 36, ...label(p.midLabel) },
          },
        ],
      },
    ],
  };
}
