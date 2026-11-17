import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LOGO_URL } from './icon-map';

/** Static header on every content slide: logo left, optional title. */
@Component({
  selector: 'rz-header-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <img class="logo" [src]="logoUrl" alt="" />
      @if (title()) {
        <h1 class="header-title">{{ title() }}</h1>
      }
    </header>
  `,
  styles: `
    .header { position: absolute; inset: 0 0 auto 0; height: 90px; background: var(--rz-header); display: flex; align-items: center; gap: 48px; padding: 0 120px; }
    .logo { height: 46px; }
    .header-title { margin: 0; font-size: 40px; font-weight: 600; }
  `,
})
export class HeaderBarComponent {
  readonly title = input<string>('');
  protected readonly logoUrl = LOGO_URL;
}
