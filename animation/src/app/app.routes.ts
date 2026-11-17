import { Routes } from '@angular/router';
import { SLIDE_ROUTES } from './slides/slides.registry';

export const routes: Routes = [
  { path: '', title: 'Übersicht', loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage) },
  { path: 'video', title: 'Video', loadComponent: () => import('./pages/video-preview.page').then((m) => m.VideoPreviewPage) },
  ...SLIDE_ROUTES,
  { path: '**', redirectTo: '' },
];
