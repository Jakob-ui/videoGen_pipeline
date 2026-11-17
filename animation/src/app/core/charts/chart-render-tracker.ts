import { Injectable } from '@angular/core';

/** Collects pending chart renders so videoApi.seek()/ready() can wait for them. */
@Injectable({ providedIn: 'root' })
export class ChartRenderTracker {
  private readonly pending = new Set<Promise<unknown>>();

  track(promise: Promise<unknown>): void {
    this.pending.add(promise);
    promise.finally(() => this.pending.delete(promise));
  }

  async whenIdle(): Promise<void> {
    while (this.pending.size > 0) await Promise.all([...this.pending]);
  }
}

export function nextFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
    step(count);
  });
}
