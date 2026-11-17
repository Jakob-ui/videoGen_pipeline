import type { Routes } from '@angular/router';
import type { Type } from '@angular/core';
import type { SlideMeta } from './slide-meta';
import { SLIDE_METAS } from './slides.meta';

/** Lazy loader per slide id – the only place that connects metas with components. */
const LOADERS: Record<string, () => Promise<Type<unknown>>> = {
  's01-intro': () => import('./s01-intro/s01-intro.component').then((m) => m.S01IntroComponent),
  's02-was-ist': () => import('./s02-was-ist/s02-was-ist.component').then((m) => m.S02WasIstComponent),
  's03-eckdaten': () => import('./s03-eckdaten/s03-eckdaten.component').then((m) => m.S03EckdatenComponent),
  's04-stichtag': () => import('./s04-stichtag/s04-stichtag.component').then((m) => m.S04StichtagComponent),
  's05-auszahlungsprofil': () =>
    import('./s05-auszahlungsprofil/s05-auszahlungsprofil.component').then((m) => m.S05AuszahlungsprofilComponent),
  's06-beispiele': () => import('./s06-beispiele/s06-beispiele.component').then((m) => m.S06BeispieleComponent),
  's07-status': () => import('./s07-status/s07-status.component').then((m) => m.S07StatusComponent),
  's08-rendite': () => import('./s08-rendite/s08-rendite.component').then((m) => m.S08RenditeComponent),
  's10-risiken': () => import('./s10-risiken/s10-risiken.component').then((m) => m.S10RisikenComponent),
  's11-cta': () => import('./s11-cta/s11-cta.component').then((m) => m.S11CtaComponent),
  's12-rechtshinweise': () =>
    import('./s12-rechtshinweise/s12-rechtshinweise.component').then((m) => m.S12RechtshinweiseComponent),
  's13-outro': () => import('./s13-outro/s13-outro.component').then((m) => m.S13OutroComponent),
};

export interface SlideRegistration {
  meta: SlideMeta;
  loadComponent: () => Promise<Type<unknown>>;
}

export const SLIDES: SlideRegistration[] = SLIDE_METAS.map((meta) => {
  const loadComponent = LOADERS[meta.id];
  if (!loadComponent) throw new Error(`Keine Komponente für Folie ${meta.id} registriert`);
  return { meta, loadComponent };
});

/** One route per slide: /slides/<id> */
export const SLIDE_ROUTES: Routes = SLIDES.map(({ meta, loadComponent }) => ({
  path: `slides/${meta.id}`,
  title: `${meta.order}. ${meta.title}`,
  loadComponent,
}));
