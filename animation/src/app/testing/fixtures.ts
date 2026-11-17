// Test helpers: loads the real JSON files from /public (Node fs is available in vitest).
import { readFileSync } from 'node:fs';
import { parseContent, type ContentData } from '../core/model/content.schema';
import { parseProduct, type ProductData } from '../core/model/product.schema';

export function loadMockProduct(): ProductData {
  return parseProduct(JSON.parse(readFileSync('public/mock/product.mock.json', 'utf8')));
}

export function loadContent(): ContentData {
  return parseContent(JSON.parse(readFileSync('public/content/content.de.json', 'utf8')));
}

/** Deep copy of the mock product with changes applied by `edit`. */
export function mockProductWith(edit: (p: ProductData) => void): ProductData {
  const p = structuredClone(loadMockProduct());
  edit(p);
  return p;
}
