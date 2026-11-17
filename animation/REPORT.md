# REPORT: Erklärvideo-App „Global Aktien Bond 106 % XII“

Stand: 11.11.2026

## Bestandsaufnahme

| Punkt | Befund |
|---|---|
| Angular | 21.2 (Standalone, Signals, zoneless, `@angular/build:application`) |
| Test-Runner | Vitest 4 über `ng test` (`@angular/build:unit-test`) |
| Statische Dateien | `public/` |
| Icon-Ordner | `animation/Icons/` (1.241 PNGs, ca. 2200 px, einfarbig dunkel auf transparent, ~69 MB) |
| Logo | `raiffeisen-zerti.svg` im Repo-Root → kopiert nach `public/brand/logo.svg` |

## Abhängigkeiten

`echarts@6.1`, `ngx-echarts@21` (v22 verlangt Angular 22), `zod@4`, `@fontsource/poppins`; Dev: `tsx`,
`@playwright/test@1.64.1`, `@types/node`.

## Icon-Zuordnung (`src/app/layout/icon-map.ts`)

Benötigte Icons wurden nach `public/icons/` kopiert (nicht der ganze 69-MB-Ordner).

| Schlüssel | Datei | Hinweis |
|---|---|---|
| shield | shield.png | |
| chart | chart-line-grow-1.png | |
| check | check.png | |
| calendar | calendar.png | |
| globe | globe-1.png | |
| equals | equally.png | |
| arrow-up | arrow-up.png | |
| info | info.png | |
| warning | warning.png | |
| link | link.png | |
| euro | euro.png | |
| clock | timer.png | **Icon-Ersatz:** kein „clock“ im Ordner |

Die PNGs sind einfarbig und werden per CSS `mask-image` + `background: currentColor` eingefärbt.

## Abweichungen von AGENT.md

1. **Zahlenformat:** `Intl.NumberFormat('de-AT')` gruppiert Tausender mit Leerzeichen („2 598,25“). Für die
   geforderte Darstellung „2.598,25“ werden die Trennzeichen von `de-DE` verwendet. Monatsnamen kommen aus
   `de-AT` („Jänner“).
2. **Texte, die in `content.de.json` fehlen**, werden weggelassen statt im Code erfunden:
   Label „Emissionspreis“ an der 100-%-Linie (S05), „Jahr n“ an der x-Achse (S06, nur Zahlen),
   „vereinfachte Darstellung“ (S07 ohne Historie). Die 0-Linie in S08 trägt `priceLabel` + `price`
   („Aktueller Kaufkurs 99,24 %“).
3. **Gelb:** `--rz-yellow` = `#FDEC09` aus dem Logo (statt `#F8E000`), wie in §9.1 vorgesehen.
4. **Outro-Logo:** Es gibt keine Logo-Variante für gelben Hintergrund; das gelbe Quadrat des Logos geht auf dem
   gelben Outro im Hintergrund auf.
5. **Hardcode-Test:** prüft ganze Zahlen (z. B. ist der S10-Cue `10600` kein Treffer für „106“).
6. **Business-Logik:** `statusYBand` und `returnsYRange` (Achsenbereiche der Graphen) liegen ebenfalls in `derive.ts`.
7. **`window.videoApi`** wird beim App-Start installiert. Aufrufer müssen auf
   `window.videoApi` warten (`wait_for_function`); steht im Pipeline-Vertrag.
8. **Preview-Bedienelemente** (Play, Scrubber, Übersicht) haben deutsche Labels im Code. Sie sind nie Teil des
   Videos.
9. **Foliendauern nach echtem TTS-Lauf (Klon-Stimme Qwen3-TTS):** Gemessen 13–18 Zeichen/s statt 15.
   S03 war mit 12.160 ms Audio > 10 % zu lang. Angepasst: S03 12.500 → 14.000 ms, S05 16.000 → 17.000 ms,
   S06 12.500 → 13.000 ms. Gesamtdauer 172.000 ms statt 169.000 ms.
10. **Playwright:** Version 1.64.1 gepinnt; über `CHROMIUM_PATH` lässt sich der bereits installierte Chromium der
   Python-Pipeline verwenden.

## Tests

- `npm test`: 164 Unit-Tests grün (derive, Formatter, Template, Narration, Budget je Variante, Manifest,
  Icons, Compliance, keine Hardcodes, 12 Graph-Snapshots).
- `CHROMIUM_PATH=… npm run e2e`: 17 E2E-Tests grün (alle 13 Folien: `ready()` < 10 s, keine Console-Errors,
  byte-identische Frames, Screenshot-Baselines; Übersicht; `?data=` mit `last = 2300` → Variante `unter`;
  Schemafehler → `ready()` rejected; `strict=1` → Mock-Rechtstexte rejected).
- Graph absichtlich geändert? `npx ng test --watch=false --update` bzw. `npm run e2e -- --update-snapshots`.

## Offene Punkte (bitte klären)

- Endpunkt und Authentifizierung des Daten-Servers. Liefert er dasselbe Schema, insbesondere `history`?
- Rechtstexte für S12 (Compliance). Derzeit „[MOCK …]“-Platzhalter.
- Logo-Variante für gelben Hintergrund (Outro).
- TTS-Engine und Sprechtempo: Der Schätzer nimmt 15 Zeichen/s an und muss nach dem ersten echten TTS-Lauf kalibriert
  werden (`CHARS_PER_SECOND` in `core/template/narration.ts`).
- Markterwartung: Datenfeld „steigend“, Text „zumindest Seitwärtsbewegung“. Der Content verwendet den Text.
- Aussprache „XII“ als „Serie 12“ bestätigen.
- Sollen Folien später dynamisch so lang werden wie das Audio? Derzeit bleibt die Folienlänge fix.
- Die Python-Pipeline (`Pipeline/pipeline.py`) nutzt noch den alten Vertrag (`window.__VIDEO__`,
  `/render/sparplan/...`, `dist/video-studio/`) und muss auf `docs/PIPELINE_CONTRACT.md` umgestellt werden.
