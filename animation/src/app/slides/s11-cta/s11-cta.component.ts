import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { IconComponent } from '../../layout/icon.component';
import { SlideBase } from '../slide-base';
import { S11_META } from './s11-cta.meta';

interface Screen {
  title: string;
  url: string;
  isin: string;
  docs: string;
}

@Component({
  selector: 'rz-s11-cta',
  imports: [SlideShellComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s11-cta.component.html',
  styleUrl: './s11-cta.component.scss',
})
export class S11CtaComponent extends SlideBase<Screen> {
  readonly meta = S11_META;
}
