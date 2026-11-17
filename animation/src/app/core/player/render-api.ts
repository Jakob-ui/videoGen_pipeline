import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { ChartRenderTracker, nextFrames } from '../charts/chart-render-tracker';
import { VideoContextStore } from '../data/video-context.store';
import { ICON_URLS } from '../../layout/icon-map';
import type { VideoManifest } from './manifest';
import { SlideClock } from './slide-clock.service';

/** The contract Playwright uses (AGENT.md §8.2). Available as window.videoApi. */
export interface VideoApi {
  getManifest(): Promise<VideoManifest>;
  ready(): Promise<void>;
  getSlideId(): string | null;
  getDurationMs(): number;
  seek(ms: number): Promise<void>;
  play(): void;
  pause(): void;
}

declare global {
  interface Window {
    videoApi: VideoApi;
  }
}

@Injectable({ providedIn: 'root' })
export class RenderApi implements VideoApi {
  private readonly store = inject(VideoContextStore);
  private readonly clock = inject(SlideClock);
  private readonly charts = inject(ChartRenderTracker);
  private readonly appRef = inject(ApplicationRef);

  /** Set by the slide shell (slide id) or the /video page ('video'). */
  readonly page = signal<string | null>(null);
  private pageMounted!: () => void;
  private readonly mounted = new Promise<void>((resolve) => (this.pageMounted = resolve));

  install(): void {
    window.videoApi = {
      getManifest: () => this.getManifest(),
      ready: () => this.ready(),
      getSlideId: () => this.getSlideId(),
      getDurationMs: () => this.getDurationMs(),
      seek: (ms) => this.seek(ms),
      play: () => this.play(),
      pause: () => this.pause(),
    };
  }

  /** Called once a slide (or the /video page) is in the DOM. */
  markMounted(page: string): void {
    this.page.set(page);
    this.pageMounted();
  }

  async getManifest(): Promise<VideoManifest> {
    await this.store.load();
    return this.store.manifest();
  }

  async ready(): Promise<void> {
    await this.store.load();
    const error = this.store.error();
    if (error) throw new Error(error);

    await this.mounted;
    const page = this.page();
    const slideIds = page === 'video' ? Object.keys(this.store.content()!.slides) : page ? [page] : [];
    slideIds.forEach((id) => this.store.checkSlide(id));

    await document.fonts.ready;
    await Promise.all([...ICON_URLS, ...Array.from(document.images).map((i) => i.src)].map(decodeImage));
    await this.seek(this.clock.t());
  }

  getSlideId(): string | null {
    const page = this.page();
    return page === 'video' ? (this.clock.current()?.id ?? null) : page;
  }

  getDurationMs(): number {
    return this.clock.durationMs();
  }

  async seek(ms: number): Promise<void> {
    this.clock.pause();
    this.clock.setTime(ms); // 1) time signal
    this.appRef.tick(); // run change detection + effects now (charts call setOption)
    this.clock.syncCssAnimations(); // 2) CSS animations (also of freshly mounted elements)
    await this.seekVideos(this.clock.localT() / 1000); // 3) <video> elements
    await this.charts.whenIdle(); // 4) charts
    await nextFrames(2);
  }

  play(): void {
    this.clock.play();
  }

  pause(): void {
    this.clock.pause();
  }

  private async seekVideos(seconds: number): Promise<void> {
    const videos = Array.from(document.querySelectorAll('video'));
    await Promise.all(
      videos.map((video) => {
        video.pause();
        const target = Math.min(seconds, Math.max(0, (video.duration || 0) - 0.001)); // hold last frame
        if (Math.abs(video.currentTime - target) < 0.0005) return Promise.resolve();
        return new Promise<void>((resolve) => {
          video.addEventListener('seeked', () => resolve(), { once: true });
          video.currentTime = target;
        });
      }),
    );
  }
}

function decodeImage(url: string): Promise<void> {
  const image = new Image();
  image.src = url;
  return image.decode().catch(() => {
    throw new Error(`Bild konnte nicht geladen werden: ${url}`);
  });
}
