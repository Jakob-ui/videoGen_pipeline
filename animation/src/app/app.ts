import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoContextStore } from './core/data/video-context.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.error(); as error) {
      <div class="error-box" role="alert">{{ error }}</div>
    } @else {
      <router-outlet />
    }
  `,
})
export class App {
  protected readonly store = inject(VideoContextStore);
}
