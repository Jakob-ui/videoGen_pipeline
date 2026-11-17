// Pure TypeScript – ordered list of all slide metas (no Angular imports).
import type { SlideMeta } from './slide-meta';
import { S01_META } from './s01-intro/s01-intro.meta';
import { S02_META } from './s02-was-ist/s02-was-ist.meta';
import { S03_META } from './s03-eckdaten/s03-eckdaten.meta';
import { S04_META } from './s04-stichtag/s04-stichtag.meta';
import { S05_META } from './s05-auszahlungsprofil/s05-auszahlungsprofil.meta';
import { S06_META } from './s06-beispiele/s06-beispiele.meta';
import { S07_META } from './s07-status/s07-status.meta';
import { S08_META } from './s08-rendite/s08-rendite.meta';
import { S10_META } from './s10-risiken/s10-risiken.meta';
import { S11_META } from './s11-cta/s11-cta.meta';
import { S12_META } from './s12-rechtshinweise/s12-rechtshinweise.meta';
import { S13_META } from './s13-outro/s13-outro.meta';

export const SLIDE_METAS: SlideMeta[] = [
  S01_META, S02_META, S03_META, S04_META, S05_META, S06_META, S07_META,
  S08_META, S10_META, S11_META, S12_META, S13_META,
];
