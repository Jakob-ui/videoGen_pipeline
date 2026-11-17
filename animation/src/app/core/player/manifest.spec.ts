import { readFileSync } from 'node:fs';
import { buildContext } from '../model/context';
import { pickNarration, narrationTexts } from '../template/narration';
import { loadContent, loadMockProduct } from '../../testing/fixtures';
import { SLIDE_METAS } from '../../slides/slides.meta';
import { maxAudioMs } from '../../slides/slide-meta';
import { buildManifest } from './manifest';

const content = loadContent();
const product = loadMockProduct();
const manifest = buildManifest({
  metas: SLIDE_METAS,
  product,
  content,
  dataSource: 'mock',
  generatedAt: '2026-11-11T00:00:00Z',
});

describe('manifest (AGENT.md §8.4)', () => {
  // Durations measured against the real cloned voice (Nov 2026 text revision, S09 removed).
  it('has 12 slides and 157500 ms', () => {
    expect(manifest.slides.length).toBe(12);
    expect(manifest.totalDurationMs).toBe(157500);
  });

  it('start times are cumulative', () => {
    let start = 0;
    for (const s of manifest.slides) {
      expect(s.startMs).toBe(start);
      start += s.durationMs;
    }
  });

  it('slide ids = content keys = routes, orders ascending', () => {
    expect(manifest.slides.map((s) => s.id)).toEqual(Object.keys(content.slides));
    manifest.slides.forEach((s, i) => {
      expect(s.order).toBe(i + 1);
      expect(s.route).toBe(`/slides/${s.id}`);
    });
  });

  it('every slide has its own meta file and component', () => {
    for (const s of manifest.slides) {
      const dir = `src/app/slides/${s.id}`;
      expect(readFileSync(`${dir}/${s.id}.meta.ts`, 'utf8')).toContain(s.id);
      expect(readFileSync(`${dir}/${s.id}.component.ts`, 'utf8')).toContain('Component');
    }
  });
});

describe('audio budget (AGENT.md §7.2)', () => {
  const ctx = buildContext(product, content);
  for (const meta of SLIDE_METAS) {
    const slide = content.slides[meta.id];
    for (const variant of Object.keys(narrationTexts(slide))) {
      it(`${meta.id} [${variant}] fits into maxAudioMs`, () => {
        const n = pickNarration(slide, ctx, content.pronunciations, variant === 'default' ? undefined : variant)!;
        expect(n.estimatedMs).toBeLessThanOrEqual(maxAudioMs(meta));
      });
    }
  }
});
