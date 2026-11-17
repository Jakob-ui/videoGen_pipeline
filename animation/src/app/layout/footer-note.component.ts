import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { VideoContextStore } from '../core/data/video-context.store';

@Component({
  selector: 'rz-footer-note',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ store.content()?.global?.footerNote }}`,
  styles: `:host { position: absolute; left: 120px; bottom: 36px; font-size: 18px; color: var(--rz-grey); }`,
})
export class FooterNoteComponent {
  protected readonly store = inject(VideoContextStore);
}
