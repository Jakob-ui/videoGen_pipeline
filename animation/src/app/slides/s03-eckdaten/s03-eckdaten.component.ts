import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { IconComponent } from '../../layout/icon.component';
import { TimelineComponent } from '../../layout/timeline.component';
import { SlideBase } from '../slide-base';
import { S03_META } from './s03-eckdaten.meta';

interface Screen {
  title: string;
  isin: string;
  underlyingLabel: string;
  underlying: string;
  underlyingDescription: string;
  timelineStart: string;
  timelineEnd: string;
  timelineMid: string;
}

@Component({
  selector: 'rz-s03-eckdaten',
  imports: [SlideShellComponent, IconComponent, TimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s03-eckdaten.component.html',
  styleUrl: './s03-eckdaten.component.scss',
})
export class S03EckdatenComponent extends SlideBase<Screen> {
  readonly meta = S03_META;
}
