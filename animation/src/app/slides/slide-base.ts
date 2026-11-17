import { computed, inject } from '@angular/core';
import { VideoContextStore } from '../core/data/video-context.store';
import { SlideClock } from '../core/player/slide-clock.service';
import type { SlideMeta } from './slide-meta';

/**
 * Small helper base class for all slides:
 * - `s()`   resolved screen texts of this slide (from content.de.json)
 * - `cue()` animation start of a cue in ms (bind to [style.animation-delay.ms])
 */
export abstract class SlideBase<TScreen> {
  abstract readonly meta: SlideMeta;

  protected readonly store = inject(VideoContextStore);
  protected readonly clock = inject(SlideClock);
  protected readonly s = computed(() => this.store.screen<TScreen>(this.meta.id));
  /** Data context – only available after a successful load (the app shows an error otherwise). */
  protected readonly ctx = computed(() => this.store.ctx()!);

  protected cue(name: string): number {
    const value = this.meta.cues[name];
    if (value === undefined) throw new Error(`${this.meta.id}: Cue "${name}" fehlt in der Meta-Datei`);
    return value;
  }
}
