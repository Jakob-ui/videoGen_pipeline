import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { TimelineComponent } from '../../layout/timeline.component';
import { SlideBase } from '../slide-base';
import { S04_META } from './s04-stichtag.meta';

interface Screen {
  title: string;
  dateLabel: string;
  date: string;
  question: string;
}

@Component({
  selector: 'rz-s04-stichtag',
  imports: [SlideShellComponent, TimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s04-stichtag.component.html',
  styleUrl: './s04-stichtag.component.scss',
})
export class S04StichtagComponent extends SlideBase<Screen> {
  readonly meta = S04_META;

  /** The S03 texts are reused so the timeline looks exactly the same (continuity). */
  protected readonly s03 = computed(() => this.store.screen<Record<string, string>>('s03-eckdaten'));
  /** Pop-in, then pulse twice right after. */
  protected readonly markerDelays = computed(() => `${this.cue('marker')}ms, ${this.cue('marker') + 500}ms`);
}
