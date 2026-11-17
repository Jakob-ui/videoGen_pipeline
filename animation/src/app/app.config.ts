import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import { environment } from '../environments/environment';
import { echarts } from './core/charts/echarts-setup';
import { HttpProductDataSource } from './core/data/http-product-data-source';
import { MockProductDataSource } from './core/data/mock-product-data-source';
import { PRODUCT_DATA_SOURCE, type ProductDataSource } from './core/data/product-data-source';
import { readUrlParams } from './core/data/url-params';
import { VideoContextStore } from './core/data/video-context.store';
import { RenderApi } from './core/player/render-api';
import { routes } from './app.routes';

/** mock (default) | http (environment.productUrl) | ?data=<url> overrides both. */
function productDataSourceFactory(): ProductDataSource {
  const http = inject(HttpClient);
  const dataUrl = readUrlParams().dataUrl;
  if (dataUrl) return new HttpProductDataSource(http, dataUrl);
  if (environment.dataSource === 'http') return new HttpProductDataSource(http, environment.productUrl);
  return new MockProductDataSource(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideEchartsCore({ echarts }),
    { provide: PRODUCT_DATA_SOURCE, useFactory: productDataSourceFactory },
    provideAppInitializer(async () => {
      const store = inject(VideoContextStore);
      inject(RenderApi).install();
      if (store.isRender) document.body.classList.add('render');
      await store.load();
      // Load the font weights before any chart measures text.
      await Promise.all(['400', '500', '600'].map((w) => document.fonts.load(`${w} 30px Poppins`)));
    }),
  ],
};
