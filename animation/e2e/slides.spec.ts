import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type {} from '../src/app/core/player/render-api'; // types for window.videoApi

const manifest = JSON.parse(readFileSync('dist/video-manifest.json', 'utf8')) as {
  slides: { id: string; route: string; durationMs: number }[];
};

async function openRendered(page: Page, route: string, query = '') {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${route}?mode=render${query}`);
  await page.waitForFunction(() => !!window.videoApi); // installed once Angular has booted
  return errors;
}

for (const slide of manifest.slides) {
  test.describe(slide.id, () => {
    test('ready() < 10 s, no console errors, deterministic, baseline', async ({ page }) => {
      const errors = await openRendered(page, slide.route);
      const started = Date.now();
      await page.evaluate(() => window.videoApi.ready());
      expect(Date.now() - started).toBeLessThan(10_000);

      // Determinism: the same t gives byte-identical frames.
      for (const t of [0, Math.floor(slide.durationMs / 2), slide.durationMs - 1]) {
        await page.evaluate((ms) => window.videoApi.seek(ms), t);
        const first = await page.screenshot();
        await page.evaluate(() => window.videoApi.seek(0));
        await page.evaluate((ms) => window.videoApi.seek(ms), t);
        expect(Buffer.compare(first, await page.screenshot()), `t=${t}`).toBe(0);
      }

      await page.evaluate((ms) => window.videoApi.seek(ms), slide.durationMs - 500);
      await expect(page).toHaveScreenshot(`${slide.id}.png`);
      expect(errors).toEqual([]);
    });
  });
}

test('overview shows 13 slides and all budgets green', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('tbody tr')).toHaveCount(13);
  await expect(page.locator('td .bad')).toHaveCount(0);
});

test('?data=<url> loads server JSON; last = 2300 switches S07 to "unter"', async ({ page }) => {
  const product = JSON.parse(readFileSync('public/mock/product.mock.json', 'utf8'));
  product.quote.underlying.last = 2300;
  await page.route((url) => url.pathname === '/test-server/product.json', (route) => route.fulfill({ json: product }));

  await openRendered(page, '/slides/s07-status', '&data=/test-server/product.json');
  await page.evaluate(() => window.videoApi.ready());
  const m = await page.evaluate(() => window.videoApi.getManifest());
  const s07 = m.slides.find((s) => s.id === 's07-status')!;
  expect(m.dataSource).toBe('http');
  expect(s07.narration!.variant).toBe('unter');
  expect(s07.narration!.spokenText).toContain('unter dem Startwert');
});

test('invalid data → ready() rejects with field path', async ({ page }) => {
  await page.route((url) => url.pathname === '/test-server/broken.json', (route) => route.fulfill({ json: { schemaVersion: 1 } }));
  await openRendered(page, '/slides/s01-intro', '&data=/test-server/broken.json');
  const result = await page.evaluate(() => window.videoApi.ready().then(() => 'ok', (e: Error) => e.message));
  expect(result).toContain('product');
});

test('strict=1 rejects mock legal texts on S12', async ({ page }) => {
  await openRendered(page, '/slides/s12-rechtshinweise', '&strict=1');
  const result = await page.evaluate(() => window.videoApi.ready().then(() => 'ok', (e: Error) => e.message));
  expect(result).toContain('MOCK');
});
