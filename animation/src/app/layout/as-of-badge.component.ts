import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** "Stand: 11.11.2026" badge (text comes from content via the slide). */
@Component({
  selector: 'rz-as-of-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}`,
  styles: `:host { display: inline-block; padding: 8px 20px; border-radius: 24px; background: var(--rz-header); font-size: 22px; color: var(--rz-text); }`,
})
export class AsOfBadgeComponent {
  readonly text = input.required<string>();
}
