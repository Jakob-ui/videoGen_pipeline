"""Records the Angular slides frame by frame via window.videoApi (see animation/docs/PIPELINE_CONTRACT.md)."""

import subprocess
import time
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlencode

from playwright.sync_api import sync_playwright

DATA_ROUTE = "/__pipeline/product.json"


def make_handler(app_dir: Path, product_file: Path | None):
    """Serves the Angular build (SPA fallback to index.html) and optionally the product JSON."""

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(app_dir), **kwargs)

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if product_file and path == DATA_ROUTE:
                body = product_file.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            requested = Path(self.translate_path(path))
            if not requested.is_file():
                self.path = "/index.html"
            super().do_GET()

        def log_message(self, *args):  # keep the terminal quiet
            pass

    return Handler


@contextmanager
def serve_app(app_dir: Path, product_file: Path | None):
    """Starts a local web server on a free port and yields its base URL."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(app_dir, product_file))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()
        server.server_close()


def launch_chromium(playwright):
    """Launches Playwright's Chromium; falls back to any Chromium already in the Playwright cache."""
    try:
        return playwright.chromium.launch(headless=True)
    except Exception as error:
        if "Executable doesn't exist" not in str(error):
            raise
        cache = Path.home() / ".cache" / "ms-playwright"
        candidates = sorted(cache.glob("chromium-*/chrome-linux*/chrome"), reverse=True)
        if not candidates:
            raise RuntimeError("Kein Chromium gefunden. Bitte einmal ausführen: playwright install chromium") from error
        print(f"  Hinweis: verwende vorhandenen Chromium {candidates[0]}")
        return playwright.chromium.launch(headless=True, executable_path=str(candidates[0]))


class SlideRecorder:
    """Opens a headless Chromium and records slides through window.videoApi."""

    def __init__(self, base_url: str, use_server_data: bool, strict: bool):
        self.base_url = base_url
        params = {"mode": "render"}
        if use_server_data:
            params["data"] = DATA_ROUTE
        if strict:
            params["strict"] = "1"
        self.query = urlencode(params)

    def __enter__(self):
        self._playwright = sync_playwright().start()
        self._browser = launch_chromium(self._playwright)
        self._context = self._browser.new_context(viewport={"width": 1920, "height": 1080})
        self.page = self._context.new_page()
        self.console_errors: list[str] = []
        self.page.on("console", lambda m: m.type == "error" and self.console_errors.append(m.text))
        self.page.on("pageerror", lambda e: self.console_errors.append(str(e)))
        return self

    def __exit__(self, *exc):
        self._context.close()
        self._browser.close()
        self._playwright.stop()

    def open(self, route: str) -> None:
        """Navigates to a slide and waits until it is fully ready (data, fonts, icons, charts)."""
        self.page.goto(f"{self.base_url}{route}?{self.query}")
        self.page.wait_for_function("() => !!window.videoApi", timeout=30_000)
        try:
            self.page.evaluate("() => window.videoApi.ready()")
        except Exception as error:
            raise RuntimeError(f"{route}: videoApi.ready() fehlgeschlagen: {error}") from error

    def get_manifest(self) -> dict:
        return self.page.evaluate("() => window.videoApi.getManifest()")

    def record_slide(self, slide: dict, fps: int, output_file: Path) -> Path:
        """Seeks every frame of one slide and pipes the screenshots into ffmpeg (H.264)."""
        self.open(slide["route"])
        frame_count = round(slide["durationMs"] / 1000 * fps)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        encoder = subprocess.Popen(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                "-pix_fmt", "yuv420p", "-r", str(fps),
                str(output_file),
            ],
            stdin=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        started = time.time()
        try:
            for frame in range(frame_count):
                self.page.evaluate("ms => window.videoApi.seek(ms)", frame * 1000 / fps)
                encoder.stdin.write(self.page.screenshot(type="jpeg", quality=95))
            encoder.stdin.close()
            if encoder.wait() != 0:
                raise RuntimeError(f"ffmpeg-Fehler bei {slide['id']}: {encoder.stderr.read().decode()}")
        except Exception:
            encoder.kill()
            raise
        print(f"  ✔ {slide['id']}: {frame_count} Frames in {time.time() - started:.0f} s", flush=True)

        if self.console_errors:
            raise RuntimeError(f"Console-Fehler auf {slide['route']}: {self.console_errors}")
        return output_file


def record_slides_worker(base_url: str, use_server_data: bool, strict: bool, slides: list[dict], fps: int, clip_dir: str):
    """Runs in its own process (own browser) – records a share of the slides."""
    with SlideRecorder(base_url, use_server_data, strict) as recorder:
        return [str(recorder.record_slide(s, fps, Path(clip_dir) / f"{s['id']}.mp4")) for s in slides]
