import { buildContext } from '../model/context';
import { loadContent, loadMockProduct } from '../../testing/fixtures';
import { narrationTexts, pickNarration } from './narration';
import { applyPronunciations, resolve, resolveDeep } from './template';

const content = loadContent();
const ctx = buildContext(loadMockProduct(), content);

describe('template engine (AGENT.md §6.2)', () => {
  it('resolves every placeholder in content.de.json (both modes, all variants)', () => {
    for (const slide of Object.values(content.slides)) {
      for (const mode of ['display', 'spoken'] as const) {
        const screen = JSON.stringify(resolveDeep(slide.screen, ctx, mode));
        expect(screen).not.toContain('{{');
        for (const text of Object.values(narrationTexts(slide))) {
          expect(resolve(text, ctx, mode)).not.toContain('{{');
        }
      }
    }
  });

  it('resolves nested placeholders', () => {
    expect(resolve('{{global.asOfLabel}}', ctx, 'display')).toBe('Stand: 11.11.2026');
  });

  it('throws on unknown paths and formatters', () => {
    expect(() => resolve('{{product.nope}}', ctx, 'display')).toThrow(/product.nope/);
    expect(() => resolve('{{product.payoutPct|nope}}', ctx, 'display')).toThrow(/nope/);
  });

  it('marks unknown paths instead of throwing when collecting errors', () => {
    const errors: string[] = [];
    expect(resolve('a {{x.y}} b', ctx, 'display', errors)).toBe('a ⟦fehlt: x.y⟧ b');
    expect(errors.length).toBe(1);
  });

  it('applies the longest pronunciation first', () => {
    expect(applyPronunciations('MSCI World 4.5% Decrement EUR Index', content.pronunciations)).toBe(
      'M S C I World 4 Komma 5 Prozent Decrement Index',
    );
  });
});

describe('narration (AGENT.md §6.4)', () => {
  it('S01 spoken text uses the pronunciation and contains no "%"', () => {
    const n = pickNarration(content.slides['s01-intro'], ctx, content.pronunciations)!;
    expect(n.spokenText).toContain('Global Aktien Bond 106 Prozent');
    expect(n.spokenText).not.toContain('%');
  });

  it('picks the variant from the derived value', () => {
    const n = pickNarration(content.slides['s07-status'], ctx, content.pronunciations)!;
    expect(n.variant).toBe('ueber');
    expect(n.spokenText).toContain('2 Komma 44 Prozent über dem Startwert');
  });

  it('no spoken text contains "%" or unresolved placeholders', () => {
    for (const slide of Object.values(content.slides)) {
      for (const variant of Object.keys(narrationTexts(slide))) {
        const n = pickNarration(slide, ctx, content.pronunciations, variant === 'default' ? undefined : variant);
        expect(n?.spokenText).not.toMatch(/%|\{\{/);
      }
    }
  });
});
