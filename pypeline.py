from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from threading import Thread

port = 8140

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/render.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('animation/render.html', 'rb') as file:
                self.wfile.write(file.read())
        else:
            self.send_error(404, "File not found")

def record_webpage():
    server = ThreadingHTTPServer(('localhost', port), Handler)
    server_thread = Thread(target=server.serve_forever)
    server_thread.start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(record_video_dir=Path("videos"), viewport={"width": 1920, "height": 1080})
            page = context.new_page()
            page.goto(f"http://localhost:{port}/render.html")
            page.wait_for_timeout(5000)
            page.close()
            context.close()
            browser.close()
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join()
        print("Cleanup completed.")
    

def generate_voiceOver(text, output_path):
    #Todo implementing Qwen3-TTS
    pass


def convert_to_mp4():
    pass


def main():
    record_webpage()
    #convert_to_mp4()


if __name__ == "__main__":
    main()