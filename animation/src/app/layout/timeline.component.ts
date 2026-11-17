import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Simple HTML/CSS term timeline used on S03 and S04 (allowed exception from "charts only with ECharts"). */
@Component({
  selector: 'rz-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mid" [class.a-fade]="animated()" [style.animation-delay.ms]="lineDelayMs() + lineDurMs() / 2">
      {{ midLabel() }}
    </div>
    <div class="track">
      <div
        class="line"
        [class.a-grow-x]="animated()"
        [style.animation-delay.ms]="lineDelayMs()"
        [style.--rz-dur]="lineDurMs() + 'ms'"
      ></div>
      <div class="marker start" [class.a-pop]="animated()" [style.animation-delay.ms]="lineDelayMs()"></div>
      <div class="marker end" [class.a-pop]="animated()" [style.animation-delay.ms]="endDelayMs()"></div>
    </div>
    <div class="labels">
      <div [class.a-fade-up]="animated()" [style.animation-delay.ms]="lineDelayMs()">
        <strong>{{ startLabel() }}</strong>
        @if (startSub()) {
          <br /><span class="sub">{{ startSub() }}</span>
        }
      </div>
      <div class="right" [class.a-fade-up]="animated()" [style.animation-delay.ms]="endDelayMs()">
        <strong>{{ endLabel() }}</strong>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; font-size: 28px; }
    .mid { text-align: center; margin-bottom: 18px; color: var(--rz-blue); font-weight: 600; }
    .track { position: relative; height: 36px; }
    .line { position: absolute; left: 0; right: 0; top: 13px; height: 10px; border-radius: 5px; background: var(--rz-blue); }
    .marker { position: absolute; top: 0; width: 36px; height: 36px; border-radius: 50%; border: 4px solid var(--rz-text); }
    .start { left: -18px; background: var(--rz-yellow); }
    .end { right: -18px; background: var(--rz-bg); border-color: var(--rz-blue); }
    .labels { display: flex; justify-content: space-between; margin-top: 18px; }
    .right { text-align: right; }
    .sub { font-size: 24px; color: #555; }
  `,
})
export class TimelineComponent {
  readonly startLabel = input.required<string>();
  readonly startSub = input('');
  readonly midLabel = input('');
  readonly endLabel = input.required<string>();
  readonly animated = input(true);
  readonly lineDelayMs = input(0);
  readonly lineDurMs = input(1500);
  readonly endDelayMs = input(0);
}
