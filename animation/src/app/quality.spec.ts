// Project-wide rules from AGENT.md §2, §9.2, §10 and §11.1.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildContext } from './core/model/context';
import { narrationTexts, pickNarration } from './core/template/narration';
import { resolveDeep } from './core/template/template';
import { ICON_MAP } from './layout/icon-map';
import { loadContent, loadMockProduct } from './testing/fixtures';

const content = loadContent();
const ctx = buildContext(loadMockProduct(), content);

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const appSources = filesIn('src/app').filter(
  (f) => /\.(ts|html|scss)$/.test(f) && !f.endsWith('.spec.ts') && !f.includes('/testing/'),
);

describe('icons (AGENT.md §9.2)', () => {
  it('every mapped icon file exists', () => {
    for (const file of Object.values(ICON_MAP)) expect(existsSync(`public/${file}`), file).toBe(true);
  });

  it('every icon key used in content and components is mapped', () => {
    const used = new Set<string>();
    for (const slide of Object.values(content.slides)) {
      for (const m of JSON.stringify(slide.screen).matchAll(/"icon":"([^"]+)"/g)) used.add(m[1]);
    }
    for (const file of appSources.filter((f) => f.endsWith('.html') || f.endsWith('.ts'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/<rz-icon[^>]*\sname="([^"]+)"/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const key of used) expect(Object.keys(ICON_MAP), key).toContain(key);
  });
});

describe('compliance (AGENT.md §10)', () => {
  const FORBIDDEN = [/garantiert/i, /garantie/i, /\bsicher(e|er|es|en)?\b/i, /risikolos/i, /ohne risiko/i];

  it('no forbidden words in any resolved text (screen + narration, both modes, all variants)', () => {
    const texts: string[] = [];
    for (const slide of Object.values(content.slides)) {
      for (const mode of ['display', 'spoken'] as const) texts.push(JSON.stringify(resolveDeep(slide.screen, ctx, mode)));
      for (const variant of Object.keys(narrationTexts(slide))) {
        const n = pickNarration(slide, ctx, content.pronunciations, variant === 'default' ? undefined : variant)!;
        texts.push(n.displayText, n.spokenText);
      }
    }
    for (const text of texts) for (const word of FORBIDDEN) expect(text, String(word)).not.toMatch(word);
  });

  it('S08 shows only the price and the fluctuation warning – no yield figures', () => {
    const s08 = JSON.stringify(content.slides['s08-rendite']);
    expect(s08).not.toContain('yield');
    expect(s08).toContain('schwanken');
  });

  it('example paths carry the fictional label', () => {
    expect(content.slides['s06-beispiele'].screen['subtitle']).toBe('{{global.fictionalLabel}}');
  });
});

describe('no hardcoded product numbers (AGENT.md §2.1)', () => {
  const NUMBERS = ['106', '129', '2536', '2598', '99.24', '99,24', '1290', '1060'];
  for (const file of appSources) {
    it(file, () => {
      const source = readFileSync(file, 'utf8');
      for (const n of NUMBERS) {
        // whole numbers only: a cue like 10600 ms is not the product value 106
        const pattern = new RegExp(`(?<![\\d.,])${n.replace(/[.]/g, '\\.')}(?![\\d]|[.,]\\d)`);
        expect(pattern.test(source), `"${n}" in ${file}`).toBe(false);
      }
    });
  }
});
