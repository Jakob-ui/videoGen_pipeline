import { defineConfig } from '@playwright/test';

/**
 * E2E + screenshot tests (AGENT.md §11.2).
 * CHROMIUM_PATH lets you reuse an already installed Chromium (e.g. the one of the Python pipeline):
 *   CHROMIUM_PATH=~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome npm run e2e
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  expect: { toHaveScreenshot: { maxDiffPixels: 0 } },
  use: {
    baseURL: 'http://localhost:4300',
    viewport: { width: 1920, height: 1080 },
    launchOptions: process.env['CHROMIUM_PATH'] ? { executablePath: process.env['CHROMIUM_PATH'] } : {},
  },
  webServer: {
    command: 'npx ng serve --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
