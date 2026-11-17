import { HttpClient } from '@angular/common/http';
import { HttpProductDataSource } from './http-product-data-source';

export const MOCK_PRODUCT_URL = '/mock/product.mock.json';

/** Same as the HTTP source, but reads the local mock file. */
export class MockProductDataSource extends HttpProductDataSource {
  override readonly kind = 'mock' as const;

  constructor(http: HttpClient) {
    super(http, MOCK_PRODUCT_URL);
  }
}
