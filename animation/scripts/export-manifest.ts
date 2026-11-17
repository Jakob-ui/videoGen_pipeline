// Writes video-manifest.json WITHOUT a browser and WITHOUT Angular (AGENT.md §8.4).
//
//   npm run export:manifest -- --data public/mock/product.mock.json \
//     --content public/content/content.de.json --out dist/video-manifest.json
//
// --data may also be an http(s) URL (server JSON with the same schema).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { parseContent } from '../src/app/core/model/content.schema';
import { parseProduct } from '../src/app/core/model/product.schema';
import { buildManifest } from '../src/app/core/player/manifest';
import { SLIDE_METAS } from '../src/app/slides/slides.meta';

const { values } = parseArgs({
  options: {
    data: { type: 'string', default: 'public/mock/product.mock.json' },
    content: { type: 'string', default: 'public/content/content.de.json' },
    out: { type: 'string', default: 'dist/video-manifest.json' },
  },
});

async function readJson(source: string): Promise<unknown> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`GET ${source} → ${response.status}`);
    return response.json();
  }
  return JSON.parse(readFileSync(source, 'utf8'));
}

async function main() {
  const isHttp = /^https?:\/\//.test(values.data!);
  const manifest = buildManifest({
    metas: SLIDE_METAS,
    product: parseProduct(await readJson(values.data!)),
    content: parseContent(await readJson(values.content!)),
    dataSource: isHttp ? 'http' : 'mock',
    generatedAt: new Date().toISOString(),
  });

  mkdirSync(dirname(values.out!), { recursive: true });
  writeFileSync(values.out!, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✔ ${values.out}: ${manifest.slides.length} Folien, ${manifest.totalDurationMs} ms`);
}

main().catch((error) => {
  console.error(`✘ ${error.message}`);
  process.exit(1);
});
