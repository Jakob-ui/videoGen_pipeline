# Pipeline-Vertrag: Angular-App ↔ Python-Pipeline

Die Angular-App (`animation/`) liefert das **Bild** und die **Sprechtexte**. Die Python-Pipeline
(`Pipeline/`) erzeugt daraus TTS-Audio, nimmt die Folien mit Playwright auf und muxt alles mit ffmpeg.

## 1. App starten

```bash
cd animation
npm run build                 # → dist/animation/browser (SPA: unbekannte Pfade auf index.html umleiten)
# oder für Entwicklung:
npm start                     # → http://localhost:4200
```

## 2. Routen

| Route | Zweck |
|---|---|
| `/` | Übersicht aller Folien (Dauer, Start, Variante, Sprechtext, Budget) |
| `/slides/<id>?mode=render` | **Eine Folie, 1:1 in 1920×1080**, keine UI, Zeit nur über `videoApi.seek()` |
| `/video?mode=render` | Alle Folien am Stück (Alternative für eine Aufnahme in einem Durchgang) |

Zusätzliche Query-Parameter:
- `data=<url>`: Produkt-JSON von einem Server statt der Mock-Datei (gleiches Schema wie `public/mock/product.mock.json`)
- `strict=1`: `ready()` schlägt fehl, solange Mock-Rechtstexte („[MOCK …]“) enthalten sind. **In Produktion immer setzen.**
- `t=<ms>`: Startzeit (nur Preview)

## 3. `window.videoApi`

> `window.videoApi` existiert erst, wenn Angular gebootet hat. **Erst darauf warten:**
> `page.wait_for_function("() => !!window.videoApi")`

```ts
interface VideoApi {
  getManifest(): Promise<VideoManifest>; // auf jeder Route
  ready(): Promise<void>;                // Daten + Texte validiert, Fonts, Icons, Charts gerendert.
                                         // Rejected mit Grund (Feldpfad) bei Fehlern.
  getSlideId(): string | null;
  getDurationMs(): number;               // aktuelle Folie bzw. Gesamtdauer auf /video
  seek(ms: number): Promise<void>;       // Frame für Zeitpunkt ms fertig gezeichnet, wenn resolved
  play(): void;                          // Echtzeit (nur für recordVideo)
  pause(): void;
}
```

Ein Frame ist eine **reine Funktion der Zeit**: `seek(t)` zweimal → byte-identischer Screenshot (per E2E-Test geprüft).

## 4. Manifest

Ohne Browser:
```bash
npm run export:manifest -- --data public/mock/product.mock.json \
  --content public/content/content.de.json --out dist/video-manifest.json
# --data darf auch eine http(s)-URL sein
```
oder im Browser: `await window.videoApi.getManifest()`.

```ts
interface VideoManifest {
  schemaVersion: 1;
  generatedAt: string;          // ISO
  dataSource: 'mock' | 'http';
  dataAsOf: string;             // product.asOf
  width: 1920; height: 1080; fps: 30;
  totalDurationMs: number;      // Summe aller durationMs (Mock: 169000)
  slides: Array<{
    id: string; order: number; route: string;   // '/slides/s05-auszahlungsprofil'
    startMs: number; durationMs: number;        // startMs = Summe der vorherigen Dauern
    narration: null | {
      variant: string | null;
      spokenText: string;       // → TTS (Zahlen ausgeschrieben, Aussprache-Ersetzungen angewendet)
      displayText: string;      // → Untertitel / Freigabe
      leadInMs: number;         // Audio-Start relativ zum Folienstart
      maxAudioMs: number;       // durationMs - leadInMs - tailMs
      estimatedMs: number;      // Schätzung bei 15 Zeichen/s
    };
  }>;
}
```

## 5. Audio-Regeln

Die **Folienlänge ist fix**, das Audio passt sich an.

1. Pro Folie mit `narration` die TTS aus `spokenText` erzeugen und die Länge `audioMs` messen.
2. Gilt `audioMs ≤ maxAudioMs`: Audio bei `startMs + leadInMs` platzieren, den Rest mit Stille auffüllen.
3. Gilt `maxAudioMs < audioMs ≤ 1,10 × maxAudioMs`: mit ffmpeg `atempo = audioMs / maxAudioMs` beschleunigen.
4. Ist das Audio noch länger: **Abbruch** mit „Folie <id>: Text kürzen oder durationMs erhöhen“.

## 6. Video-Aufnahme

Je Folie:
```python
page.goto(f"{base}{slide['route']}?mode=render&strict=1")
page.wait_for_function("() => !!window.videoApi")
page.evaluate("() => window.videoApi.ready()")
for frame in range(round(slide['durationMs'] / 1000 * fps)):
    page.evaluate("ms => window.videoApi.seek(ms)", frame * 1000 / fps)
    png = page.screenshot(type="png")      # → ffmpeg image2pipe
```
Danach die Folien-Clips per ffmpeg-concat aneinanderhängen (Kopfleiste und Footer sind auf allen Inhaltsfolien
identisch und statisch, der Inhalt blendet in den ersten und letzten 400 ms; harte Schnitte springen also nicht)
und die Audiospur muxen.
