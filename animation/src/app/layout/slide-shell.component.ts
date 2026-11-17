import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoContextStore } from '../core/data/video-context.store';
import { RenderApi } from '../core/player/render-api';
import { SlideClock } from '../core/player/slide-clock.service';
import { SLIDE_FADE_MS, type SlideMeta } from '../slides/slide-meta';
import { SLIDE_METAS } from '../slides/slides.meta';
import { FooterNoteComponent } from './footer-note.component';
import { HeaderBarComponent } from './header-bar.component';
import { StageComponent } from './stage.component';

/** true when the slide is shown inside /video (the video page owns stage, clock and controls). */
export const SLIDE_EMBEDDED = new InjectionToken<boolean>('SLIDE_EMBEDDED', { factory: () => false });

const CONTROLS_HEIGHT = 140;

/**
 * Frame of every slide:
 * - 'content' layout: static header + footer, content fades in/out (400 ms) inside.
 * - 'full' layout: full-bleed (intro/outro).
 * Standalone (/slides/<id>) it also owns the stage, the clock timeline and the preview controls.
 */
@Component({
  selector: 'rz-slide-shell',
  imports: [DecimalPipe, NgTemplateOutlet, RouterLink, StageComponent, HeaderBarComponent, FooterNoteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-shell.component.html',
  host: { '[class.render]': 'store.isRender' },
})
export class SlideShellComponent implements OnInit {
  readonly meta = input.required<SlideMeta>();
  readonly layout = input<'content' | 'full'>('content');
  readonly headerTitle = input<string>('');

  protected readonly store = inject(VideoContextStore);
  protected readonly clock = inject(SlideClock);
  protected readonly embedded = inject(SLIDE_EMBEDDED);
  private readonly renderApi = inject(RenderApi);
  private readonly destroyRef = inject(DestroyRef);

  /** Fade-in at 0 ms, fade-out during the last 400 ms. */
  protected readonly fadeDelays = computed(() => `0ms, ${this.meta().durationMs - SLIDE_FADE_MS}ms`);

  protected readonly scale = signal(1);
  protected readonly prev = computed(() => SLIDE_METAS[this.meta().order - 2]);
  protected readonly next = computed(() => SLIDE_METAS[this.meta().order]);

  constructor() {
    afterNextRender(() => {
      if (this.embedded) return;
      this.clock.syncCssAnimations();
      this.renderApi.markMounted(this.meta().id);
    });
    this.destroyRef.onDestroy(() => this.clock.pause());
  }

  ngOnInit(): void {
    if (this.embedded) return;
    const meta = this.meta();
    this.clock.setTimeline([{ id: meta.id, startMs: 0, durationMs: meta.durationMs }]);
    this.clock.setTime(this.store.params.startMs);

    if (!this.store.isRender) {
      const fit = () =>
        this.scale.set(Math.min((window.innerWidth - 48) / 1920, (window.innerHeight - CONTROLS_HEIGHT) / 1080));
      fit();
      window.addEventListener('resize', fit);
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', fit));
    }
  }

  protected togglePlay(): void {
    if (this.clock.playing()) this.clock.pause();
    else this.clock.play();
  }

  protected scrub(event: Event): void {
    this.clock.pause();
    this.clock.setTime(Number((event.target as HTMLInputElement).value));
  }
}
