import json
import os
import sys
from pathlib import Path
from urllib.request import urlopen

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
VIDEO = ROOT / "output" / "product_video.mp4"
DATA_FILE = ROOT / "temp" / "product_data.json"
PRODUCT_URL = os.getenv("PRODUCT_URL")
sys.path.insert(0, str(ROOT / "Pipeline"))

app = FastAPI()
app.mount("/videos", StaticFiles(directory=VIDEO.parent), name="videos")


@app.post("/generate/{isin}")
def generate_video(isin: str, cat: str, lang: str, request: Request):
    try:
        if PRODUCT_URL:
            url = PRODUCT_URL.format(isin=isin)
            with urlopen(url, timeout=30) as response:
                product_data = json.load(response)
        else:
            product_data = {
                "isin": isin,
                "name": "Mock product",
                "category": cat,
                "language": lang,
                "description": "Temporary mock data for video generation.",
            }

        DATA_FILE.parent.mkdir(exist_ok=True)
        DATA_FILE.write_text(
            json.dumps(
                {
                    "isin": isin,
                    "language": lang,
                    "product_category": cat,
                    "product": product_data,
                }
            ),
            encoding="utf-8",
        )

        from pipeline import main as run_pipeline

        run_pipeline()
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if not VIDEO.exists():
        raise HTTPException(status_code=500, detail="The pipeline did not create a video.")

    return {
        "message": "Video generated",
        "video_url": str(request.base_url).rstrip("/") + "/videos/product_video.mp4",
    }
