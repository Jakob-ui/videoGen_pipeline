import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The fixed 1920×1080 stage. In preview it is scaled down to fit the window. */
@Component({
  selector: 'rz-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stage-box" [style.width.px]="1920 * scale()" [style.height.px]="1080 * scale()">
      <div class="stage" [style.transform]="'scale(' + scale() + ')'"><ng-content /></div>
    </div>
  `,
  styles: `
    .stage-box { position: relative; overflow: hidden; }
    .stage { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; transform-origin: 0 0; overflow: hidden; background: var(--rz-bg); }
  `,
})
export class StageComponent {
  readonly scale = input(1);
}
