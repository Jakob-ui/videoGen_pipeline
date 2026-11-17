import { DecimalPipe, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
  type Type,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoContextStore } from '../core/data/video-context.store';
import { RenderApi } from '../core/player/render-api';
import { SlideClock } from '../core/player/slide-clock.service';
import { SLIDE_EMBEDDED } from '../layout/slide-shell.component';
import { StageComponent } from '../layout/stage.component';
import { SLIDES } from '../slides/slides.registry';

/** "/video" – plays all slides one after another on one shared clock. */
@Component({
  selector: 'rz-video-preview-page',
  imports: [NgComponentOutlet, StageComponent, RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.isRender) {
      <rz-stage>
        @if (current(); as c) { <ng-container *ngComponentOutlet="c; injector: embedded" /> }
      </rz-stage>
    } @else {
      <div class="preview">
        <rz-stage [scale]="scale()">
          @if (current(); as c) { <ng-container *ngComponentOutlet="c; injector: embedded" /> }
        </rz-stage>
        <div class="controls">
          <button type="button" (click)="togglePlay()">{{ clock.playing() ? '❚❚ Pause' : '▶ Play' }}</button>
          <input type="range" min="0" [max]="clock.durationMs() - 1" [value]="clock.t()" (input)="scrub($event)" />
          <span class="time">{{ clock.t() | number: '1.0-0' }} / {{ clock.durationMs() | number }} ms</span>
        </div>
        <nav class="nav">
          <a routerLink="/">Übersicht</a>
          <strong>{{ clock.current()?.id }}</strong>
        </nav>
      </div>
    }
  `,
})
export class VideoPreviewPage {
  protected readonly store = inject(VideoContextStore);
  protected readonly clock = inject(SlideClock);
  private readonly renderApi = inject(RenderApi);

  private readonly components = signal<Type<unknown>[]>([]);
  protected readonly current = computed(() => this.components()[this.clock.currentIndex()] ?? null);
  protected readonly embedded = Injector.create({
    providers: [{ provide: SLIDE_EMBEDDED, useValue: true }],
    parent: inject(Injector),
  });
  protected readonly scale = signal(Math.min((window.innerWidth - 48) / 1920, (window.innerHeight - 140) / 1080));

  constructor() {
    let start = 0;
    this.clock.setTimeline(
      SLIDES.map(({ meta }) => {
        const entry = { id: meta.id, startMs: start, durationMs: meta.durationMs };
        start += meta.durationMs;
        return entry;
      }),
    );
    this.clock.setTime(this.store.params.startMs);

    Promise.all(SLIDES.map((s) => s.loadComponent())).then((components) => {
      this.components.set(components);
      requestAnimationFrame(() => {
        this.clock.syncCssAnimations();
        this.renderApi.markMounted('video');
      });
    });
    inject(DestroyRef).onDestroy(() => this.clock.pause());
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
