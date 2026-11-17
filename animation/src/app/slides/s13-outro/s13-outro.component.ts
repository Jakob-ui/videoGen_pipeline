import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { LOGO_URL } from '../../layout/icon-map';
import { SlideBase } from '../slide-base';
import { S13_META } from './s13-outro.meta';

type Screen = Record<string, never>;

@Component({
  selector: 'rz-s13-outro',
  imports: [SlideShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s13-outro.component.html',
  styleUrl: './s13-outro.component.scss',
})
export class S13OutroComponent extends SlideBase<Screen> {
  readonly meta = S13_META;
  protected readonly logoUrl = LOGO_URL;
}
