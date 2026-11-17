import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { IconComponent } from '../../layout/icon.component';
import { LOGO_URL } from '../../layout/icon-map';
import { SlideBase } from '../slide-base';
import { S01_META } from './s01-intro.meta';

interface Screen {
  title: string;
  pill: string;
  subtitle: string;
}

@Component({
  selector: 'rz-s01-intro',
  imports: [SlideShellComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s01-intro.component.html',
  styleUrl: './s01-intro.component.scss',
})
export class S01IntroComponent extends SlideBase<Screen> {
  readonly meta = S01_META;
  protected readonly logoUrl = LOGO_URL;
}
