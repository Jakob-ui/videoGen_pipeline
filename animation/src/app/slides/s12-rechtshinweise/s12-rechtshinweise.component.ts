import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { SLIDE_FADE_MS } from '../slide-meta';
import { SlideBase } from '../slide-base';
import { S12_META } from './s12-rechtshinweise.meta';

interface Screen {
  title: string;
  pages: string[];
}

@Component({
  selector: 'rz-s12-rechtshinweise',
  imports: [SlideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s12-rechtshinweise.component.html',
  styleUrl: './s12-rechtshinweise.component.scss',
})
export class S12RechtshinweiseComponent extends SlideBase<Screen> {
  readonly meta = S12_META;

  private readonly fade = SLIDE_FADE_MS;

  /** Each page fades in at its cue and (except the last) fades out right before the next page. */
  protected pageDelays(index: number): string {
    const start = this.cue('page' + index);
    const next = this.meta.cues['page' + (index + 1)];
    return next === undefined ? `${start}ms` : `${start}ms, ${next - this.fade}ms`;
  }
}
