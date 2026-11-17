// Pure TypeScript – placeholder engine {{ path | formatter }} (AGENT.md §6.2).
import { FORMATTERS, type Mode } from './formatters';

const PLACEHOLDER = /\{\{\s*([^}|]+?)\s*(?:\|\s*([A-Za-z]+)\s*)?\}\}/g;
const MAX_DEPTH = 3;

/**
 * If `errors` is passed, unknown paths are not thrown but marked red-able as
 * "⟦fehlt: path⟧" and collected (used in preview). Otherwise an Error is thrown.
 */
export type ErrorCollector = string[];

export function getPath(ctx: unknown, path: string): unknown {
  let value: unknown = ctx;
  for (const key of path.split('.')) {
    if (value === null || typeof value !== 'object' || !(key in value)) {
      throw new Error(`Unbekannter Pfad: ${path}`);
    }
    value = (value as Record<string, unknown>)[key];
  }
  if (value === undefined || value === null) throw new Error(`Pfad ohne Wert: ${path}`);
  return value;
}

export function resolve(text: string, ctx: unknown, mode: Mode, errors?: ErrorCollector): string {
  let result = text;
  for (let depth = 0; depth < MAX_DEPTH && result.includes('{{'); depth++) {
    result = result.replace(PLACEHOLDER, (_match, path: string, formatterName?: string) => {
      try {
        const value = getPath(ctx, path);
        if (!formatterName) return String(value);
        const formatter = FORMATTERS[formatterName];
        if (!formatter) throw new Error(`Unbekannter Formatter: ${formatterName}`);
        return formatter(value, mode);
      } catch (e) {
        if (!errors) throw e;
        errors.push((e as Error).message);
        return `⟦fehlt: ${path}⟧`;
      }
    });
  }
  if (result.includes('{{')) {
    const message = `Platzhalter nicht auflösbar (zu tief verschachtelt?): ${text}`;
    if (!errors) throw new Error(message);
    errors.push(message);
  }
  return result;
}

/** Resolves every string inside an object/array (e.g. a slide's `screen`). */
export function resolveDeep<T>(value: T, ctx: unknown, mode: Mode, errors?: ErrorCollector): T {
  if (typeof value === 'string') return resolve(value, ctx, mode, errors) as T;
  if (Array.isArray(value)) return value.map((v) => resolveDeep(v, ctx, mode, errors)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveDeep(v, ctx, mode, errors);
    return out as T;
  }
  return value;
}

/** Replacements for the spoken form only. Longest key first. */
export function applyPronunciations(text: string, pronunciations: Record<string, string>): string {
  const keys = Object.keys(pronunciations).sort((a, b) => b.length - a.length);
  let result = text;
  for (const key of keys) result = result.split(key).join(pronunciations[key]);
  return result;
}
