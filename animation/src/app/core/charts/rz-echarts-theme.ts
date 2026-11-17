// Pure TypeScript – the ONE place that defines how all charts look.
// Option builders only use these constants; they never invent their own colors.

export const RZ_COLORS = {
  yellow: '#FDEC09', // taken from the logo (raiffeisen-zerti.svg)
  blue: '#456898',
  blueLight: '#9FB3CF',
  grey: '#9A9A9A',
  greyLight: '#E6E4DF',
  text: '#1A1A1A',
  white: '#FFFFFF',
} as const;

export const RZ_FONT = 'Poppins';

export const RZ_SIZES = {
  mainLine: 10,
  helperLine: 2,
  axisLabel: 22,
  label: 26,
  marker: 26,
} as const;

/** "#456898" + 0.5 → "rgba(69,104,152,0.5)". Used to fade chart parts with progress. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 1000) / 1000;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const axis = {
  axisLine: { show: true, lineStyle: { color: RZ_COLORS.grey, width: RZ_SIZES.helperLine } },
  axisTick: { show: false },
  axisLabel: { color: RZ_COLORS.text, fontSize: RZ_SIZES.axisLabel, fontFamily: RZ_FONT },
  splitLine: { show: false },
  nameTextStyle: { color: RZ_COLORS.grey, fontSize: RZ_SIZES.axisLabel, fontFamily: RZ_FONT },
};

/** Registered as 'rz-video' in echarts-setup.ts. */
export const RZ_ECHARTS_THEME = {
  color: [RZ_COLORS.blue, RZ_COLORS.blueLight, RZ_COLORS.grey],
  backgroundColor: 'transparent',
  textStyle: { fontFamily: RZ_FONT, color: RZ_COLORS.text },
  valueAxis: axis,
  timeAxis: axis,
  categoryAxis: axis,
  line: { lineStyle: { width: RZ_SIZES.mainLine, cap: 'round', join: 'round' }, symbol: 'none' },
};

export const RZ_THEME_NAME = 'rz-video';
