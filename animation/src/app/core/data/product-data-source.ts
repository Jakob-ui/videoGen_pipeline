import { InjectionToken } from '@angular/core';
import type { ProductData } from '../model/product.schema';

export interface ProductDataSource {
  load(): Promise<ProductData>;
  readonly kind: 'mock' | 'http';
}

export const PRODUCT_DATA_SOURCE = new InjectionToken<ProductDataSource>('PRODUCT_DATA_SOURCE');
