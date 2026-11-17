import { computed, inject, Injectable, signal } from '@angular/core';
import { SLIDE_METAS } from '../../slides/slides.meta';
import type { ContentData } from '../model/content.schema';
import { buildContext, type TemplateContext } from '../model/context';
import type { ProductData } from '../model/product.schema';
import { buildManifest, type VideoManifest } from '../player/manifest';
import { pickNarration } from '../template/narration';
import { resolveDeep } from '../template/template';
import { ContentSource } from './content-source';
import { PRODUCT_DATA_SOURCE } from './product-data-source';
import { readUrlParams } from './url-params';

/** Holds product data, content and everything derived from it. Loaded once at app start. */
@Injectable({ providedIn: 'root' })
export class VideoContextStore {
  private readonly productSource = inject(PRODUCT_DATA_SOURCE);
  private readonly contentSource = inject(ContentSource);

  readonly params = readUrlParams();
  readonly isRender = this.params.mode === 'render';

  readonly product = signal<ProductData | null>(null);
  readonly content = signal<ContentData | null>(null);
  readonly error = signal<string | null>(null);

  readonly ctx = computed<TemplateContext | null>(() => {
    const product = this.product();
    const content = this.content();
    return product && content ? buildContext(product, content) : null;
  });

  private loading?: Promise<void>;

  /** Loads + validates both JSON files. Never throws; errors end up in `error()`. */
  load(): Promise<void> {
    this.loading ??= (async () => {
      try {
        const [product, content] = await Promise.all([this.productSource.load(), this.contentSource.load()]);
        this.product.set(product);
        this.content.set(content);
        buildContext(product, content); // fail early if derived values can't be computed
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : String(e));
      }
    })();
    return this.loading;
  }

  /**
   * Resolved screen texts of a slide (display mode).
   * Unknown placeholders are shown as "⟦fehlt: …⟧"; `checkSlide()` turns them into errors.
   */
  screen<T>(slideId: string): T {
    const ctx = this.ctx();
    const slide = this.content()?.slides[slideId];
    if (!ctx || !slide) return {} as T;
    return resolveDeep(slide.screen, ctx, 'display', []) as T;
  }

  /** Throws if a slide can't be rendered correctly (used by videoApi.ready()). */
  checkSlide(slideId: string): void {
    const error = this.error();
    if (error) throw new Error(error);
    const ctx = this.ctx()!;
    const content = this.content()!;
    const slide = content.slides[slideId];
    if (!slide) throw new Error(`content.de.json: Folie "${slideId}" fehlt`);

    resolveDeep(slide.screen, ctx, 'display'); // throws on unknown path / formatter
    pickNarration(slide, ctx, content.pronunciations); // throws on missing variant

    if (this.params.strict && JSON.stringify(slide.screen).includes('[MOCK')) {
      throw new Error(`Folie ${slideId}: Platzhaltertext "[MOCK …]" im strict-Modus nicht erlaubt`);
    }
  }

  manifest(): VideoManifest {
    const error = this.error();
    if (error) throw new Error(error);
    return buildManifest({
      metas: SLIDE_METAS,
      product: this.product()!,
      content: this.content()!,
      dataSource: this.productSource.kind,
      generatedAt: new Date().toISOString(), // metadata only, never rendered
    });
  }
}
