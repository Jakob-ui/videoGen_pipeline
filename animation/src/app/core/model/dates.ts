// Pure TypeScript – deterministic date helpers (never uses "now").

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar day (YYYY-MM-DD) of an ISO date or date-time in Europe/Vienna. */
export function viennaDay(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

/** Milliseconds (UTC midnight) of a calendar day YYYY-MM-DD. */
export function dayToMs(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayToMs(to) - dayToMs(from)) / DAY_MS);
}

export function addDays(dayMs: number, days: number): number {
  return dayMs + days * DAY_MS;
}
