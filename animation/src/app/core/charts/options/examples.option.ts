// Pure TypeScript – Graph 2: two fictional example paths (AGENT.md §7.5.2).
import { FORMATTERS } from '../../template/formatters';
import { revealSeries, type Point } from '../reveal';
import { RZ_COLORS, RZ_SIZES, withAlpha } from '../rz-echarts-theme';

export interface ExamplesVm {
  termYears: number;
  pathA: number[];
  pathB: number[];
  labelA: string;
  resultA: string;
  labelB: string;
  resultB: string;
  startLabel: string;
  durationLabel: string;
}

export interface ExamplesState {
  axes: number;
  pathA: number;
  resultA: number;
  dimA: number;
  pathB: number;
  resultB: number;
}

export const EXAMPLES_SIZE = { width: 1680, height: 620 };

/** x values evenly spread over the term: i * termYears / (n - 1). */
function toPoints(path: number[], termYears: number): Point[] {
  return path.map((y, i) => [(i * termYears) / (path.length - 1), y]);
}

function pathSeries(id: string, points: Point[], progress: number, opacity: number, label: string, labelOpacity: number) {
  const end = points[points.length - 1];
  return [
    {
      id,
      type: 'line',
      smooth: 0.35,
      symbol: 'none',
      data: revealSeries(points, progress),
      lineStyle: { width: RZ_SIZES.mainLine, cap: 'round', color: withAlpha(RZ_COLORS.blue, opacity) },
    },
    {
      id: `${id}-end`,
      type: 'scatter',
      z: 5,
      data: [
        {
          value: end,
          symbolSize: labelOpacity > 0 ? RZ_SIZES.marker : 0,
          itemStyle: { color: RZ_COLORS.yellow, borderColor: RZ_COLORS.text, borderWidth: 3, opacity },
          label: {
            show: true,
            formatter: label,
            position: 'right',
            distance: 24,
            fontSize: RZ_SIZES.label,
            lineHeight: 38,
            color: withAlpha(RZ_COLORS.text, labelOpacity * opacity),
          },
        },
      ],
    },
  ];
}

export function buildExamplesOption(vm: ExamplesVm, p: ExamplesState) {
  const axisColor = withAlpha(RZ_COLORS.grey, p.axes);
  const textColor = withAlpha(RZ_COLORS.text, p.axes);
  const opacityA = 1 - 0.75 * p.dimA;

  return {
    animation: false,
    grid: { left: 130, right: 560, top: 50, bottom: 70 },
    xAxis: {
      type: 'value',
      min: 0,
      max: vm.termYears,
      interval: 1,
      axisLine: { onZero: false, lineStyle: { color: axisColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      min: -40,
      max: 20,
      interval: 10,
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: { color: textColor, formatter: (v: number) => FORMATTERS['pctSigned'](v, 'display') },
    },
    series: [
      {
        id: 'guides',
        type: 'scatter',
        z: 6,
        data: [{ value: [0, 0], symbolSize: RZ_SIZES.marker * p.axes, itemStyle: { color: RZ_COLORS.yellow } }],
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: RZ_SIZES.helperLine, color: axisColor },
          label: { color: textColor, fontSize: RZ_SIZES.axisLabel },
          data: [
            { yAxis: 0, label: { formatter: vm.startLabel, position: 'insideMiddleBottom' } },
            { xAxis: vm.termYears, label: { formatter: vm.durationLabel, position: 'end' } },
          ],
        },
      },
      ...pathSeries('a', toPoints(vm.pathA, vm.termYears), p.pathA, opacityA, `${vm.labelA}\n${vm.resultA}`, p.resultA),
      ...pathSeries('b', toPoints(vm.pathB, vm.termYears), p.pathB, 1, `${vm.labelB}\n${vm.resultB}`, p.resultB),
    ],
  };
}
