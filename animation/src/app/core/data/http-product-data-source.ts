import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { parseProduct, type ProductData } from '../model/product.schema';
import type { ProductDataSource } from './product-data-source';

/** Loads product JSON from a server (GET) and validates it with zod. */
export class HttpProductDataSource implements ProductDataSource {
  readonly kind: 'mock' | 'http' = 'http';

  constructor(
    private readonly http: HttpClient,
    private readonly url: string,
  ) {}

  async load(): Promise<ProductData> {
    if (!this.url) throw new Error('Keine Produktdaten-URL konfiguriert (environment.productUrl oder ?data=)');
    const json = await firstValueFrom(this.http.get<unknown>(this.url));
    return parseProduct(json);
  }
}
