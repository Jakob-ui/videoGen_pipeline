import { computed, Injectable, signal } from '@angular/core';

export interface TimelineEntry {
  id: string;
  startMs: number;
  durationMs: number;
}

/**
 * The single source of time. A frame is a pure function of `localT` (ms since slide start).
 *
 * - On /slides/<id> the timeline has one entry.
 * - On /video the timeline has all slides; `currentIndex` says which one is visible.
 * - Preview: play() advances time with requestAnimationFrame.
 * - Render mode: time only changes via videoApi.seek().
 */
@Injectable({ providedIn: 'root' })
export class SlideClock {
  readonly t = signal(0);
  readonly timeline = signal<TimelineEntry[]>([]);
  readonly playing = signal(false);

  readonly durationMs = computed(() => this.timeline().reduce((sum, e) => sum + e.durationMs, 0));

  readonly currentIndex = computed(() => {
    const t = this.t();
    const entries = this.timeline();
    const index = entries.findIndex((e) => t < e.startMs + e.durationMs);
    return index === -1 ? entries.length - 1 : index;
  });

  readonly current = computed<TimelineEntry | undefined>(() => this.timeline()[this.currentIndex()]);

  /** Time since the start of the current slide – what slides use. */
  readonly localT = computed(() => this.t() - (this.current()?.startMs ?? 0));

  private rafId = 0;

  setTimeline(entries: TimelineEntry[]): void {
    this.pause();
    this.timeline.set(entries);
    this.t.set(0);
  }

  setTime(ms: number): void {
    const max = Math.max(0, this.durationMs() - 1);
    this.t.set(Math.min(max, Math.max(0, ms)));
    this.syncCssAnimations();
  }

  /** Pauses every CSS animation and moves it to the current slide time (seekable!). */
  syncCssAnimations(): void {
    const t = this.localT();
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = t;
    }
  }

  play(): void {
    if (this.playing()) return;
    if (this.t() >= this.durationMs() - 1) this.setTime(0);
    this.playing.set(true);
    let last = performance.now();
    const tick = (now: number) => {
      this.setTime(this.t() + (now - last));
      last = now;
      if (this.t() >= this.durationMs() - 1) this.pause();
      else this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  pause(): void {
    cancelAnimationFrame(this.rafId);
    this.playing.set(false);
  }
}
