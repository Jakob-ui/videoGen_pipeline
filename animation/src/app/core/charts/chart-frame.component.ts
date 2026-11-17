import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ChartRenderTracker, nextFrames } from './chart-render-tracker';
import { RZ_THEME_NAME } from './rz-echarts-theme';

/**
 * Wrapper around ngx-echarts with a fixed pixel size and the SVG renderer.
 * ngx-echarts applies every new `option` with setOption(notMerge) – the chart is a pure function of the option.
 * This wrapper only reports to the ChartRenderTracker when a render has landed on screen.
 */
@Component({
  selector: 'rz-chart',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      echarts
      [theme]="theme"
      [options]="option()"
      [initOpts]="{ renderer: 'svg', width: width(), height: height() }"
      [autoResize]="false"
      [style.width.px]="width()"
      [style.height.px]="height()"
      (chartInit)="chart.set($event)"
    ></div>
  `,
})
export class ChartFrameComponent {
  readonly option = input.required<EChartsCoreOption>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();

  protected readonly theme = RZ_THEME_NAME;
  protected readonly chart = signal<ECharts | null>(null);
  private readonly tracker = inject(ChartRenderTracker);
  private firstRenderDone!: () => void;

  constructor() {
    // ready() must wait until the chart exists and has been drawn once.
    this.tracker.track(new Promise<void>((resolve) => (this.firstRenderDone = resolve)));

    effect(() => {
      this.option(); // re-run on every new option
      if (!this.chart()) return;
      this.tracker.track(nextFrames(2).then(() => this.firstRenderDone()));
    });
  }
}
