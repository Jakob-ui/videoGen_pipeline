export const environment = {
  /** 'mock' loads /mock/product.mock.json; 'http' loads `productUrl`. `?data=<url>` overrides both. */
  dataSource: 'mock' as 'mock' | 'http',
  /** URL of the future product data server (same schema as product.mock.json). */
  productUrl: '',
  contentUrl: '/content/content.de.json',
};
