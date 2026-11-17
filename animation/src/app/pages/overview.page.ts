import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoContextStore } from '../core/data/video-context.store';
import { SLIDE_METAS } from '../slides/slides.meta';

/** "/" – all slides with duration, start time, narration and audio budget. Dev tool, not part of the video. */
@Component({
  selector: 'rz-overview-page',
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage {
  private readonly store = inject(VideoContextStore);

  protected readonly manifest = computed(() => this.store.manifest());
  protected readonly titles = Object.fromEntries(SLIDE_METAS.map((m) => [m.id, m.title]));

  protected readonly allBudgetsOk = computed(() =>
    this.manifest().slides.every((s) => !s.narration || s.narration.estimatedMs <= s.narration.maxAudioMs),
  );
}
