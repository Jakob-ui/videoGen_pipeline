print("Starting pipeline...")
import math
from pathlib import Path
import subprocess
import ffmpeg
from playwright.sync_api import sync_playwright
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from datetime import datetime
from Audio.voiceOver import generate_voiceover

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANIMATION_ROOT = PROJECT_ROOT / "animation"
ANGULAR_OUTPUT = ANIMATION_ROOT / "dist" / "video-studio" / "browser"
RENDER_URL = "/render/sparplan/sparplan-europa"
PORT = 8140

class AngularHandler(SimpleHTTPRequestHandler):
    """Serve the Angular build and fall back to index.html for SPA routes."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ANGULAR_OUTPUT), **kwargs)

    def do_GET(self):
        requested_path = Path(self.translate_path(self.path.split("?", 1)[0]))
        if not requested_path.is_file() and "." not in requested_path.name:
            self.path = "/index.html"
        super().do_GET()


def build_animation():
    if not (ANIMATION_ROOT / "package.json").is_file():
        raise FileNotFoundError(f"Angular-Projekt fehlt: {ANIMATION_ROOT}")

    try:
        subprocess.run(
            ["npm", "run", "build"],
            cwd=ANIMATION_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as error:
        raise RuntimeError(
            f"Angular-Build fehlgeschlagen:\n{error.stdout}\n{error.stderr}"
        ) from error

    if not (ANGULAR_OUTPUT / "index.html").is_file():
        raise RuntimeError(f"Angular-Build erzeugte keine index.html: {ANGULAR_OUTPUT}")


def start_server():
    server = ThreadingHTTPServer(("localhost", PORT), AngularHandler)
    server_thread = Thread(target=server.serve_forever)
    server_thread.start()
    return server, server_thread


def record_webpage():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    server, server_thread = start_server()
    print(f"Server started at http://localhost:{PORT}{RENDER_URL}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = context.new_page()
            page.goto(f"http://localhost:{PORT}{RENDER_URL}")
            page.wait_for_function("window.__VIDEO__ && window.__VIDEO__.ready")
            metadata = page.evaluate(
                """() => ({
                    durationMs: window.__VIDEO__.durationMs,
                    narration: window.__VIDEO__.scenes
                        .map(scene => scene.narration)
                        .filter(Boolean)
                        .join(' ')
                })"""
            )
            output_video_path = PROJECT_ROOT / "temp" / "rec" / f"recorded_{timestamp}.webm"
            fps = 30
            frame_count = math.ceil(metadata["durationMs"] / 1000 * fps)
            print(f"Recording {frame_count} frames at {fps} fps")
            encoder = subprocess.Popen(
                [
                        "ffmpeg",
                        "-y",
                        "-f", "image2pipe",
                        "-vcodec", "png",
                        "-r", str(fps),
                        "-i", "-",
                        "-an",
                        "-c:v", "libvpx-vp9",
                        "-pix_fmt", "yuv420p",
                        str(output_video_path),
                ],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            try:
                for frame in range(frame_count):
                        page.evaluate(
                            "ms => window.__VIDEO__.seek(ms)",
                            frame * 1000 / fps,
                        )
                        encoder.stdin.write(page.screenshot(type="png"))
                encoder.stdin.close()
                error_output = encoder.stderr.read().decode("utf-8", errors="replace")
                if encoder.wait() != 0:
                        raise RuntimeError(f"FFmpeg-Videoencoding fehlgeschlagen:\n{error_output}")
            except Exception:
                encoder.kill()
                encoder.wait()
                raise
            finally:
                page.close()
                context.close()
            browser.close()
            return output_video_path, metadata["narration"]
    except Exception as e:
        raise RuntimeError(f"An error occurred while recording the webpage: {e}") from e
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join()
        print("Cleanup completed.")

def convert_to_mp4(audiopath, videopath, outputpath):
    audio_file = Path(audiopath)
    video_file = Path(videopath)
    output_file = Path(outputpath)

    if not audio_file.is_file():
        raise FileNotFoundError(f"Audiodatei fehlt: {audio_file}")

    if not video_file.is_file():
        raise FileNotFoundError(f"Videodatei fehlt: {video_file}")

    output_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        (
            ffmpeg
            .output(
                ffmpeg.input(str(video_file)).video,
                ffmpeg.input(str(audio_file)).audio,
                str(output_file),
                vcodec="libx264",
                pix_fmt="yuv420p",
                acodec="aac",
                shortest=None,
                movflags="+faststart",
            )
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as error:
        raise RuntimeError(
            f"FFmpeg konnte das Video nicht erzeugen: {error}"
        ) from error

    if not output_file.is_file() or output_file.stat().st_size == 0:
        raise RuntimeError(
            f"Die MP4-Datei wurde nicht korrekt erzeugt: {output_file}"
        )

    return output_file



def main():
    try:
        build_animation()
        output_video_path, narration = record_webpage()
        audio_path = generate_voiceover(
            narration,
            PROJECT_ROOT / "temp" / "rec" / "voiceover.wav",
        )
        output_path = convert_to_mp4(
            audio_path,
            output_video_path,
            PROJECT_ROOT / "output" / "product_video.mp4",
        )
        print(f"Video erfolgreich erstellt: {output_path}")

    except Exception as error:
        print(f"Pipeline fehlgeschlagen: {error}")
        raise

if __name__ == "__main__":
    main()