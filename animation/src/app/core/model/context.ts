// Pure TypeScript – builds the placeholder context for {{path|formatter}} (AGENT.md §6.2).
import type { ContentData } from './content.schema';
import { derive, type DerivedValues } from './derive';
import type { ProductData } from './product.schema';

export type TemplateContext = ProductData & {
  derived: DerivedValues;
  illustrations: ContentData['illustrations'];
  global: ContentData['global'];
};

export function buildContext(product: ProductData, content: ContentData): TemplateContext {
  return {
    ...product,
    derived: derive(product, content.illustrations),
    illustrations: content.illustrations,
    global: content.global,
  };
}
