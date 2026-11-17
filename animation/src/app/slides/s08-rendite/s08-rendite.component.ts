import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { IconComponent } from '../../layout/icon.component';
import { AsOfBadgeComponent } from '../../layout/as-of-badge.component';
import { SlideBase } from '../slide-base';
import { S08_META } from './s08-rendite.meta';

type Screen = Record<string, string>;

@Component({
  selector: 'rz-s08-rendite',
  imports: [SlideShellComponent, AsOfBadgeComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s08-rendite.component.html',
  styleUrl: './s08-rendite.component.scss',
})
export class S08RenditeComponent extends SlideBase<Screen> {
  readonly meta = S08_META;
}
