/** Query parameters that control the app (AGENT.md §8.1). Read once from the URL. */
export interface UrlParams {
  mode: 'preview' | 'render';
  dataUrl: string | null;
  startMs: number;
  strict: boolean;
}

export function readUrlParams(search = window.location.search): UrlParams {
  const params = new URLSearchParams(search);
  return {
    mode: params.get('mode') === 'render' ? 'render' : 'preview',
    dataUrl: params.get('data'),
    startMs: Number(params.get('t') ?? 0) || 0,
    strict: params.get('strict') === '1',
  };
}
