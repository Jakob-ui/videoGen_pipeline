import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { ChartFrameComponent } from '../../core/charts/chart-frame.component';
import { easeInOut, phases } from '../../core/player/timing';
import { AsOfBadgeComponent } from '../../layout/as-of-badge.component';
import { statusVm } from '../../core/charts/chart-vms';
import { buildStatusOption, STATUS_SIZE, type StatusState } from '../../core/charts/options/status.option';
import { SlideBase } from '../slide-base';
import { S07_META } from './s07-status.meta';

type Screen = Record<string, string>;

@Component({
  selector: 'rz-s07-status',
  imports: [SlideShellComponent, ChartFrameComponent, AsOfBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s07-status.component.html',
  styleUrl: './s07-status.component.scss',
})
export class S07StatusComponent extends SlideBase<Screen> {
  readonly meta = S07_META;

  protected readonly size = STATUS_SIZE;
  protected readonly option = computed(() =>
    buildStatusOption(
      statusVm(this.ctx(), this.s()),
      phases<StatusState>(this.meta, this.clock.localT(), { zoomOut: easeInOut }),
    ),
  );
}
