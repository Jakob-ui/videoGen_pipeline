// Pure TypeScript – semantic icon key → file in public/icons (copied from animation/Icons).

export const ICON_MAP = {
  shield: 'icons/shield.png',
  chart: 'icons/chart-line-grow-1.png',
  check: 'icons/check.png',
  calendar: 'icons/calendar.png',
  globe: 'icons/globe-1.png',
  equals: 'icons/equally.png',
  'arrow-up': 'icons/arrow-up.png',
  info: 'icons/info.png',
  warning: 'icons/warning.png',
  link: 'icons/link.png',
  euro: 'icons/euro.png',
  clock: 'icons/timer.png',
} as const;

export type IconName = keyof typeof ICON_MAP;

export const ICON_URLS = Object.values(ICON_MAP).map((file) => `/${file}`);

export const LOGO_URL = '/brand/logo.svg';
