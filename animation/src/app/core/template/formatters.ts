// Pure TypeScript – formatters for {{path|formatter}} in two modes (AGENT.md §6.3).
import { viennaDay } from '../model/dates';

export type Mode = 'display' | 'spoken';
export type Formatter = (value: unknown, mode: Mode) => string;

const MINUS = '−'; // real minus sign

/** Round half up (away from zero) to `decimals`, robust against float noise like 1.005. */
export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return (Math.sign(value) * Math.round(Math.abs(value) * factor + 1e-9)) / factor;
}

/**
 * German number formatting "2.598,25".
 * de-DE is used for the separators because de-AT groups thousands with a space.
 */
function num(value: number, minDecimals: number, maxDecimals: number, grouping = true): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    useGrouping: grouping,
  }).format(roundHalfUp(value, maxDecimals));
}

/** "99 Komma 24" – how TTS should read a decimal number. */
function spokenNumber(value: number, maxDecimals: number): string {
  const [intPart, decPart] = num(Math.abs(value), 0, maxDecimals, false).split(',');
  return decPart ? `${intPart} Komma ${decPart}` : intPart;
}

function asNumber(value: unknown, formatter: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Formatter "${formatter}" erwartet eine Zahl, bekam ${JSON.stringify(value)}`);
  }
  return value;
}

const pctAbs: Formatter = (v, mode) => {
  const n = Math.abs(asNumber(v, 'pctAbs'));
  return mode === 'display' ? `${num(n, 0, 2)} %` : `${spokenNumber(n, 2)} Prozent`;
};

const pct: Formatter = (v, mode) => {
  const n = asNumber(v, 'pct');
  if (mode === 'spoken') return `${n < 0 ? 'minus ' : ''}${spokenNumber(n, 2)} Prozent`;
  return `${n < 0 ? MINUS : ''}${num(Math.abs(n), 0, 2)} %`;
};

const pctSigned: Formatter = (v, mode) => {
  const n = asNumber(v, 'pctSigned');
  if (mode === 'spoken') return pctAbs(n, mode); // the sentence carries the direction
  const rounded = roundHalfUp(n, 2);
  const sign = rounded > 0 ? '+' : rounded < 0 ? MINUS : '';
  return `${sign}${num(Math.abs(n), 0, 2)} %`;
};

const eur: Formatter = (v, mode) => {
  const n = asNumber(v, 'eur');
  return mode === 'display' ? `${num(n, 0, 2)} €` : `${num(n, 0, 2, false)} Euro`;
};

const pts: Formatter = (v, mode) => {
  const n = asNumber(v, 'pts');
  return mode === 'display' ? num(n, 2, 2) : String(Math.round(n));
};

const int: Formatter = (v, mode) => {
  const n = Math.round(asNumber(v, 'int'));
  return mode === 'display' ? num(n, 0, 0) : String(n);
};

const date: Formatter = (v, mode) => {
  if (typeof v !== 'string') throw new Error(`Formatter "date" erwartet einen ISO-String`);
  const [y, m, d] = viennaDay(v).split('-').map(Number);
  if (mode === 'display') return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
  const month = new Intl.DateTimeFormat('de-AT', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  ); // de-AT → "Jänner"
  return `${d}. ${month} ${y}`;
};

const NUMBER_WORDS = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

const yearsApprox: Formatter = (v, mode) => {
  const n = asNumber(v, 'yearsApprox');
  if (mode === 'display') return `ca. ${num(n, 1, 1)} Jahre`;

  const halves = Math.round(n * 2); // round to half years
  const whole = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  if (whole === 0) return half ? 'rund ein halbes Jahr' : 'weniger als ein halbes Jahr';
  if (whole === 1 && !half) return 'rund ein Jahr';
  const word = whole < NUMBER_WORDS.length ? NUMBER_WORDS[whole] : String(whole);
  return `rund ${word}${half ? (whole < NUMBER_WORDS.length ? 'einhalb' : ',5') : ''} Jahre`;
};

export const FORMATTERS: Record<string, Formatter> = {
  pct,
  pctAbs,
  pctSigned,
  eur,
  pts,
  int,
  date,
  yearsApprox,
};
