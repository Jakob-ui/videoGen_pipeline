"""
HTTP API for on-demand video generation.

  uvicorn FastApi.main:app --port 8000

  # mock data (ISIN must match the mock product):
  curl -X POST "http://localhost:8000/generate/AT0000A3UL37"

  # current product values in the request body (same schema as animation/public/mock/product.mock.json):
  curl -X POST "http://localhost:8000/generate/AT0000A3UL37?voice=clone" \
       -H "Content-Type: application/json" -d @my_product.json
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from threading import Lock
from urllib.request import urlopen

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "output"
TEMP_DIR = ROOT / "temp"
MOCK_PRODUCT = ROOT / "animation" / "public" / "mock" / "product.mock.json"
PRODUCT_URL = os.getenv("PRODUCT_URL")  # e.g. https://server/products/{isin}.json
sys.path.insert(0, str(ROOT / "Pipeline"))

from pipeline import run as run_pipeline  # noqa: E402

OUTPUT_DIR.mkdir(exist_ok=True)
app = FastAPI(title="Produktvideo-Pipeline")
app.mount("/videos", StaticFiles(directory=OUTPUT_DIR), name="videos")

# One render at a time: the pipeline uses the GPU and several browsers.
render_lock = Lock()


def load_product(isin: str, body: dict | None) -> dict:
    if body:
        product = body
    elif PRODUCT_URL:
        with urlopen(PRODUCT_URL.format(isin=isin), timeout=30) as response:
            product = json.load(response)
    else:
        product = json.loads(MOCK_PRODUCT.read_text(encoding="utf-8"))

    product_isin = product.get("product", {}).get("isin")
    if product_isin != isin:
        raise HTTPException(status_code=404, detail=f"Keine Produktdaten für ISIN {isin} (Daten haben {product_isin})")
    return product


@app.post("/generate/{isin}")
def generate_video(
    isin: str,
    request: Request,
    voice: str = "clone",
    strict: bool = False,
    product: dict | None = Body(default=None),
):
    """Renders the video with the given (or mock) product values. Takes a few minutes."""
    if voice not in ("clone", "none"):
        raise HTTPException(status_code=422, detail="voice muss 'clone' oder 'none' sein")

    product_data = load_product(isin, product)
    if not render_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Es wird bereits ein Video erzeugt.")
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        data_file = TEMP_DIR / f"product_{isin}_{timestamp}.json"
        data_file.parent.mkdir(exist_ok=True)
        data_file.write_text(json.dumps(product_data, ensure_ascii=False), encoding="utf-8")

        output = OUTPUT_DIR / f"{isin}_{timestamp}.mp4"
        run_pipeline(product_file=data_file, voice=voice, output=output, strict=strict, skip_build=True)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    finally:
        render_lock.release()

    base = str(request.base_url).rstrip("/")
    return {
        "message": "Video generated",
        "video_url": f"{base}/videos/{output.name}",
        "subtitles_url": f"{base}/videos/{output.with_suffix('.srt').name}",
        "manifest_url": f"{base}/videos/{output.with_suffix('.manifest.json').name}",
    }
