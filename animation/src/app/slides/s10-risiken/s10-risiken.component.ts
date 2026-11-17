import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { IconComponent } from '../../layout/icon.component';
import { SlideBase } from '../slide-base';
import { S10_META } from './s10-risiken.meta';

interface Screen {
  title: string;
  chances: string[];
  risks: string[];
}

@Component({
  selector: 'rz-s10-risiken',
  imports: [SlideShellComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s10-risiken.component.html',
  styleUrl: './s10-risiken.component.scss',
})
export class S10RisikenComponent extends SlideBase<Screen> {
  readonly meta = S10_META;

  /** Chances appear staggered by 350 ms, risks in sync with the voice (cues risk0…risk4). */
  protected chanceDelay(index: number): number {
    return this.cue('chances') + index * 350;
  }
}
