import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { ChartFrameComponent } from '../../core/charts/chart-frame.component';
import { phases } from '../../core/player/timing';
import { examplesVm } from '../../core/charts/chart-vms';
import { buildExamplesOption, EXAMPLES_SIZE, type ExamplesState } from '../../core/charts/options/examples.option';
import { SlideBase } from '../slide-base';
import { S06_META } from './s06-beispiele.meta';

type Screen = Record<string, string>;

@Component({
  selector: 'rz-s06-beispiele',
  imports: [SlideShellComponent, ChartFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s06-beispiele.component.html',
  styleUrl: './s06-beispiele.component.scss',
})
export class S06BeispieleComponent extends SlideBase<Screen> {
  readonly meta = S06_META;

  protected readonly size = EXAMPLES_SIZE;
  protected readonly option = computed(() =>
    buildExamplesOption(examplesVm(this.ctx(), this.s()), phases<ExamplesState>(this.meta, this.clock.localT())),
  );
}
