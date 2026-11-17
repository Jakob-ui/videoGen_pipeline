import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICON_MAP } from './icon-map';

/**
 * <rz-icon name="shield" [size]="120" />
 * The PNG is used as a CSS mask, so the icon takes the current text color.
 */
@Component({
  selector: 'rz-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    class: 'rz-icon',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.mask-image]': 'maskImage()',
  },
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(64);

  protected readonly maskImage = computed(() => {
    const file = ICON_MAP[this.name() as keyof typeof ICON_MAP];
    if (!file) throw new Error(`Icon "${this.name()}" ist nicht in icon-map.ts gemappt`);
    return `url(/${file})`;
  });
}
