import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SlideShellComponent } from '../../layout/slide-shell.component';
import { ChartFrameComponent } from '../../core/charts/chart-frame.component';
import { phases } from '../../core/player/timing';
import { payoffVm } from '../../core/charts/chart-vms';
import { buildPayoffOption, PAYOFF_SIZE, type PayoffState } from '../../core/charts/options/payoff.option';
import { SlideBase } from '../slide-base';
import { S05_META } from './s05-auszahlungsprofil.meta';

type Screen = Record<string, string>;

@Component({
  selector: 'rz-s05-auszahlungsprofil',
  imports: [SlideShellComponent, ChartFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './s05-auszahlungsprofil.component.html',
  styleUrl: './s05-auszahlungsprofil.component.scss',
})
export class S05AuszahlungsprofilComponent extends SlideBase<Screen> {
  readonly meta = S05_META;

  protected readonly size = PAYOFF_SIZE;
  protected readonly option = computed(() =>
    buildPayoffOption(payoffVm(this.ctx(), this.s()), phases<PayoffState>(this.meta, this.clock.localT())),
  );
}
