# Erklärvideo-App (Angular)

Folien-basierte Video-App für das Kapitalschutz-Zertifikat „Global Aktien Bond 106 % XII“.
Spezifikation: `../AGENT.md` · Schnittstelle zur Python-Pipeline: `docs/PIPELINE_CONTRACT.md` · Stand/Abweichungen: `REPORT.md`

```bash
npm start                    # http://localhost:4200  → Übersicht, /slides/<id>, /video
npm test                     # Unit- und Snapshot-Tests
npm run export:manifest      # dist/video-manifest.json (ohne Browser)
npm run e2e                  # Playwright (optional CHROMIUM_PATH=…)
```

| Was | Wo |
|---|---|
| Produktdaten (Mock) | `public/mock/product.mock.json` |
| Alle Texte | `public/content/content.de.json` |
| Fachlogik | `src/app/core/model/derive.ts` |
| Folien (Meta + Komponente) | `src/app/slides/sXX-*/` |
| Graphen | `src/app/core/charts/options/*.option.ts` |
