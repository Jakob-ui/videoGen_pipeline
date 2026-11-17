### This is going to be a pipeline to create AI Product Videos

## Prototype

For the Prototype I want to have a fully functioning pipeline. 
Features:
- Build a fully functional prototype pipeline for generating product videos from a web-based application
- Use one or more Python scripts to create videos automatically
- Ensure that both the visual content and voice-over are dynamically updated with the latest product information (using ai voice cloning)
- Provide an HTTP API endpoint (e.g. using FastApi) to trigger on-demand video generation
- Allow the API request to include the current product values, at least for the MVP, to demonstrate real-time video creation.
## Demo-Video erzeugen

```bash
source videoGen-venv/bin/activate

python Pipeline/pipeline.py                     # komplettes Video mit Klon-Stimme → output/product_video.mp4 (+ .srt)
python Pipeline/pipeline.py --voice none        # schnell, ohne Stimme (~2 min)
python Pipeline/pipeline.py --data mein.json    # eigene Produktwerte (Schema: animation/public/mock/product.mock.json)
python Pipeline/pipeline.py --slides s05,s07    # nur einzelne Folien testen
```

Ablauf: Angular-App bauen → Manifest lesen → TTS je Folie (GPU, Cache in `temp/tts_cache`) → Folien
parallel per `videoApi.seek()` aufnehmen → mit ffmpeg zusammenschneiden. Ist ein Sprechtext zu lang
für seine Folie, bricht die Pipeline vor der Aufnahme ab.

### API

```bash
uvicorn FastApi.main:app --port 8000
curl -X POST "http://localhost:8000/generate/AT0000A3UL37"                       # Mock-Daten
curl -X POST "http://localhost:8000/generate/AT0000A3UL37" \
     -H "Content-Type: application/json" -d @mein_produkt.json                   # aktuelle Werte im Request
```

Schnittstelle App ↔ Pipeline: `animation/docs/PIPELINE_CONTRACT.md`
