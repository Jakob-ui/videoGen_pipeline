import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

interface VideoScene {
  startMs: number;
  endMs: number;
  narration: string;
}

interface VideoApi {
  ready: boolean;
  durationMs: number;
  scenes: VideoScene[];
  seek: (timeMs: number) => void;
}

const SCENES: VideoScene[] = [
  {
    startMs: 0,
    endMs: 3500,
    narration: 'Kapitalschutz trifft globale Chancen.',
  },
  {
    startMs: 3500,
    endMs: 7500,
    narration: 'Der Global Aktien Bond verbindet 100 Prozent Kapitalschutz am Laufzeitende mit einer attraktiven Partizipation.',
  },
  {
    startMs: 7500,
    endMs: 11000,
    narration: 'Bei positiver Entwicklung erhalten Sie 106 Prozent Ihres eingesetzten Kapitals zurück.',
  },
  {
    startMs: 11000,
    endMs: 14500,
    narration: 'Global investieren. Gelassen bleiben. Informieren Sie sich jetzt.',
  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="video-frame" [class.is-playing]="isPlaying">
      <div class="grid-glow"></div>
      <header class="brand">
        <span class="brand-mark">P</span>
        <span class="brand-name">Powers <b>Doctor Evidence</b></span>
      </header>

      <section class="content" *ngIf="sceneIndex === 0">
        <p class="eyebrow">STRUKTURIERTE ANLAGE</p>
        <h1>Kapitalschutz,<br><em>globale Chancen.</em></h1>
        <p class="intro">Der Global Aktien Bond verbindet Sicherheit mit der Dynamik der internationalen Aktienmärkte.</p>
        <div class="line"></div>
      </section>

      <section class="content split" *ngIf="sceneIndex === 1">
        <div>
          <p class="eyebrow">GLOBAL AKTIEN BOND</p>
          <h2>Sicherheit trifft<br><em>Wachstum.</em></h2>
        </div>
        <div class="shield">
          <span>100%</span>
          <small>KAPITALSCHUTZ<br>AM LAUFZEITENDE</small>
        </div>
      </section>

      <section class="content centered" *ngIf="sceneIndex === 2">
        <p class="eyebrow">IHRE CHANCE</p>
        <div class="return-value">106<span>%</span></div>
        <h2>Rückzahlung bei positiver Entwicklung</h2>
        <p class="muted">Ihr eingesetztes Kapital bleibt geschützt*.</p>
      </section>

      <section class="content centered final" *ngIf="sceneIndex === 3">
        <p class="eyebrow">GLOBAL INVESTIEREN</p>
        <h2>Gelassen in<br><em>die Zukunft.</em></h2>
        <button type="button" (click)="restart()">Video erneut abspielen</button>
        <p class="disclaimer">*Der Kapitalschutz gilt zum Laufzeitende und vorbehaltlich der Bonität des Emittenten. Keine Anlageberatung.</p>
      </section>

      <footer>
        <span>GLOBAL AKTIEN BOND</span>
        <span>{{ progressLabel }}</span>
      </footer>
      <div class="progress"><div [style.width.%]="progress"></div></div>
    </main>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly durationMs = 14500;
  readonly scenes = SCENES;
  sceneIndex = 0;
  progress = 0;
  isPlaying = true;
  private currentTime = 0;
  private timer?: number;

  get progressLabel(): string {
    return `${Math.round(this.progress)}%`;
  }

  ngOnInit(): void {
    const videoApi: VideoApi = {
      ready: true,
      durationMs: this.durationMs,
      scenes: this.scenes,
      seek: (timeMs: number) => this.seek(timeMs),
    };
    window.__VIDEO__ = videoApi;
    this.timer = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.seek(this.currentTime + 50);
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
  }

  restart(): void {
    this.isPlaying = true;
    this.seek(0);
  }

  private seek(timeMs: number): void {
    this.currentTime = Math.max(0, Math.min(timeMs, this.durationMs));
    this.progress = (this.currentTime / this.durationMs) * 100;
    const activeScene = this.scenes.findIndex(
      (scene) => this.currentTime >= scene.startMs && this.currentTime < scene.endMs,
    );
    this.sceneIndex = activeScene === -1 ? this.scenes.length - 1 : activeScene;
    if (this.currentTime >= this.durationMs) this.isPlaying = false;
  }
}

declare global {
  interface Window {
    __VIDEO__: VideoApi;
  }
}
