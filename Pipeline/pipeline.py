import os
from itertools import product
from pathlib import Path
import ffmpeg
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from threading import Thread
from datetime import datetime
from Audio.voiceOver import generate_voiceover

port = 8140

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/render.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('../animation/render.html', 'rb') as file:
                self.wfile.write(file.read())
        else:
            self.send_error(404, "File not found")

def record_webpage():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    server = ThreadingHTTPServer(('localhost', port), Handler)
    server_thread = Thread(target=server.serve_forever)
    server_thread.start()
    print(f"Server started at http://localhost:{port}/render.html")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(record_video_dir=Path("temp/rec"), viewport={"width": 1920, "height": 1080})
            page = context.new_page()
            page.goto(f"http://localhost:{port}/render.html")
            page.wait_for_timeout(5000)
            video = page.video
            page.close()
            context.close()
            os.rename(video.path(), f"temp/rec/recorded_{timestamp}.webm")
            output_video_path = f"temp/rec/recorded_{timestamp}.webm"
            browser.close()
            return output_video_path
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
        output_video_path = record_webpage()
        audio_path = generate_voiceover(
            "Hallo, dies ist ein Test für die Sprachsynthese.",
            "temp/rec/voiceover.wav",
        )
        output_path = convert_to_mp4(
            audio_path,
            output_video_path,
            "output/product_video.mp4",
        )
        print(f"Video erfolgreich erstellt: {output_path}")

    except Exception as error:
        print(f"Pipeline fehlgeschlagen: {error}")
        raise

if __name__ == "__main__":
    main()