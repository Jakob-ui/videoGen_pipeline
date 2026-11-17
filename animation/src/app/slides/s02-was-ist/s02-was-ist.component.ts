import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { IconComponent } from '../../layout/icon.component';
import { SlideBase } from '../slide-base';
import { S02_META } from './s02-was-ist.meta';

interface Screen {
  items: { icon: string; text: string }[];
}

@Component({
  selector: 'rz-s02-was-ist',
  imports: [SlideShellComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s02-was-ist.component.html',
  styleUrl: './s02-was-ist.component.scss',
})
export class S02WasIstComponent extends SlideBase<Screen> {
  readonly meta = S02_META;
}
