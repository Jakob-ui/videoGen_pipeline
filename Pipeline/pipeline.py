"""
Product video pipeline:

  1. build the Angular app (animation/)            → dist/animation/browser
  2. serve it + the product JSON, read the manifest (window.videoApi.getManifest())
  3. TTS per slide from manifest.spokenText        → narration.wav (fixed slide lengths, audio fits in)
  4. record every slide frame by frame via seek()  → one H.264 clip per slide
  5. concat clips + mux audio                      → output/product_video.mp4 (+ .srt)

Contract with the app: animation/docs/PIPELINE_CONTRACT.md

Usage:
  python Pipeline/pipeline.py                         # mock data, cloned voice
  python Pipeline/pipeline.py --voice none            # fast: silent video (no TTS)
  python Pipeline/pipeline.py --data my_product.json  # own product values (same schema as the mock)
  python Pipeline/pipeline.py --slides s05,s07        # only some slides (quick test)
"""

import argparse
import json
import shutil
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audio_track import build_narration_track, write_srt  # noqa: E402
from recorder import SlideRecorder, record_slides_worker, serve_app  # noqa: E402

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANIMATION_ROOT = PROJECT_ROOT / "animation"
APP_DIR = ANIMATION_ROOT / "dist" / "animation" / "browser"
OUTPUT_DIR = PROJECT_ROOT / "output"
TEMP_DIR = PROJECT_ROOT / "temp"
TTS_CACHE = TEMP_DIR / "tts_cache"


def step(text: str) -> None:
    print(f"\n▶ {text}", flush=True)


def build_animation() -> None:
    if not (ANIMATION_ROOT / "package.json").is_file():
        raise FileNotFoundError(f"Angular-Projekt fehlt: {ANIMATION_ROOT}")
    if not (ANIMATION_ROOT / "node_modules").is_dir():
        subprocess.run(["npm", "install"], cwd=ANIMATION_ROOT, check=True)
    result = subprocess.run(["npm", "run", "build"], cwd=ANIMATION_ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Angular-Build fehlgeschlagen:\n{result.stdout}\n{result.stderr}")
    if not (APP_DIR / "index.html").is_file():
        raise RuntimeError(f"Angular-Build erzeugte keine index.html: {APP_DIR}")


def concat_and_mux(clips: list[Path], audio: Path, output: Path, work_dir: Path) -> Path:
    list_file = work_dir / "clips.txt"
    list_file.write_text("".join(f"file '{c.resolve()}'\n" for c in clips), encoding="utf-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(list_file),
            "-i", str(audio),
            "-map", "0:v", "-map", "1:a",
            # 48 kHz stereo: the TTS delivers 24 kHz mono, which many players/browsers play silently.
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-shortest", "-movflags", "+faststart",
            str(output),
        ],
        check=True,
    )
    if not output.is_file() or output.stat().st_size == 0:
        raise RuntimeError(f"Die MP4-Datei wurde nicht korrekt erzeugt: {output}")
    return output


def run(
    product_file: Path | None = None,
    voice: str = "clone",
    output: Path = OUTPUT_DIR / "product_video.mp4",
    slides_filter: list[str] | None = None,
    strict: bool = False,
    skip_build: bool = False,
    fps: int | None = None,
    workers: int = 4,
) -> Path:
    started = time.time()
    work_dir = TEMP_DIR / f"run_{datetime.now():%Y%m%d_%H%M%S}"
    work_dir.mkdir(parents=True, exist_ok=True)

    if product_file is not None:
        product_file = Path(product_file).resolve()
        json.loads(product_file.read_text(encoding="utf-8"))  # fail fast on broken JSON

    if skip_build and (APP_DIR / "index.html").is_file():
        step("Angular-Build übersprungen")
    else:
        step("Angular-App bauen")
        build_animation()

    with serve_app(APP_DIR, product_file) as base_url:
        with SlideRecorder(base_url, use_server_data=product_file is not None, strict=strict) as recorder:
            step("Manifest lesen")
            recorder.open("/slides/s01-intro")
            manifest = recorder.get_manifest()
            if slides_filter:
                manifest = select_slides(manifest, slides_filter)
            fps = fps or manifest["fps"]
            (work_dir / "video-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
            print(f"  {len(manifest['slides'])} Folien, {manifest['totalDurationMs'] / 1000:.1f} s, "
                  f"Daten: {manifest['dataSource']} (Stand {manifest['dataAsOf']})")

            step("Voice-over erzeugen" if voice != "none" else "Voice-over: aus (stille Tonspur)")
            tts = None
            if voice != "none":
                from Audio.voiceOver import VoiceOver
                tts = VoiceOver(TTS_CACHE)
            audio_file = work_dir / "narration.wav"
            cues = build_narration_track(manifest, tts, audio_file)

        step(f"Folien aufnehmen ({fps} fps, {workers} Browser parallel)")
        clips = record_all(base_url, product_file is not None, strict, manifest["slides"], fps, work_dir / "clips", workers)

    step("Zusammenschneiden")
    output = Path(output)
    concat_and_mux(clips, audio_file, output, work_dir)
    write_srt(cues, output.with_suffix(".srt"))
    shutil.copy(work_dir / "video-manifest.json", output.with_suffix(".manifest.json"))

    print(f"\n✔ Video erstellt: {output}  ({time.time() - started:.0f} s)")
    return output


def record_all(base_url, use_server_data, strict, slides, fps, clip_dir: Path, workers: int) -> list[Path]:
    """Splits the slides over several browser processes (longest first) and returns the clips in order."""
    workers = max(1, min(workers, len(slides)))
    shares: list[list[dict]] = [[] for _ in range(workers)]
    loads = [0] * workers
    for slide in sorted(slides, key=lambda s: -s["durationMs"]):
        i = loads.index(min(loads))
        shares[i].append(slide)
        loads[i] += slide["durationMs"]

    with ProcessPoolExecutor(max_workers=workers) as pool:
        jobs = [
            pool.submit(record_slides_worker, base_url, use_server_data, strict, share, fps, str(clip_dir))
            for share in shares
        ]
        for job in jobs:
            job.result()  # re-raises errors from the workers
    return [clip_dir / f"{s['id']}.mp4" for s in slides]


def select_slides(manifest: dict, prefixes: list[str]) -> dict:
    """Keeps only matching slides and recomputes start times (for quick tests)."""
    slides = [s for s in manifest["slides"] if any(s["id"].startswith(p) for p in prefixes)]
    if not slides:
        raise ValueError(f"Keine Folie passt zu {prefixes}")
    start = 0
    for s in slides:
        s["startMs"] = start
        start += s["durationMs"]
    return {**manifest, "slides": slides, "totalDurationMs": start}


def main(argv: list[str] | None = None) -> Path:
    parser = argparse.ArgumentParser(description="Erzeugt das Produktvideo aus der Angular-App.")
    parser.add_argument("--data", type=Path, help="Produkt-JSON (Schema wie animation/public/mock/product.mock.json)")
    parser.add_argument("--voice", choices=["clone", "none"], default="clone", help="none = ohne TTS (schnell)")
    parser.add_argument("--out", type=Path, default=OUTPUT_DIR / "product_video.mp4")
    parser.add_argument("--slides", help="nur diese Folien, z. B. s05,s07")
    parser.add_argument("--strict", action="store_true", help="Mock-Rechtstexte verbieten (Produktion)")
    parser.add_argument("--skip-build", action="store_true", help="vorhandenen Angular-Build verwenden")
    parser.add_argument("--workers", type=int, default=4, help="parallele Browser für die Aufnahme")
    parser.add_argument("--fps", type=int, help="überschreibt die fps aus dem Manifest (z. B. 15 für schnelle Tests)")
    args = parser.parse_args(argv)

    try:
        return run(
            product_file=args.data,
            voice=args.voice,
            output=args.out,
            slides_filter=args.slides.split(",") if args.slides else None,
            strict=args.strict,
            skip_build=args.skip_build,
            fps=args.fps,
            workers=args.workers,
        )
    except Exception as error:
        print(f"\n✘ Pipeline fehlgeschlagen: {error}")
        raise


if __name__ == "__main__":
    main()
