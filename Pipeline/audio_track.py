"""Builds one narration track for the whole video from the manifest (audio rules: PIPELINE_CONTRACT.md §5)."""

import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

MAX_SPEEDUP = 1.10
SILENT_SAMPLE_RATE = 24_000


class AudioTooLongError(Exception):
    pass


def speed_up(samples: np.ndarray, rate: int, factor: float) -> np.ndarray:
    """ffmpeg atempo – faster speech without changing the pitch."""
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp) / "in.wav", Path(tmp) / "out.wav"
        sf.write(src, samples, rate)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-filter:a", f"atempo={factor:.5f}", str(dst)],
            check=True,
        )
        result, _ = sf.read(dst, dtype="float32")
    return result


def fit_to_slide(slide: dict, samples: np.ndarray, rate: int) -> tuple[np.ndarray, float]:
    """Applies the rules: fits → as is; ≤ 10 % too long → atempo; longer → abort."""
    narration = slide["narration"]
    audio_ms = len(samples) / rate * 1000
    max_ms = narration["maxAudioMs"]

    if audio_ms <= max_ms:
        return samples, 1.0
    factor = audio_ms / max_ms
    if factor <= MAX_SPEEDUP:
        fitted = speed_up(samples, rate, factor)
        return fitted[: int(max_ms / 1000 * rate)], factor
    raise AudioTooLongError(
        f"Folie {slide['id']}: Text kürzen oder durationMs erhöhen "
        f"(Audio {audio_ms:.0f} ms, erlaubt {max_ms} ms)"
    )


def build_narration_track(manifest: dict, voice, output_file: Path) -> list[dict]:
    """
    Generates TTS per slide (voice=None → silent track) and places it at startMs + leadInMs.
    Returns cue info for subtitles: [{id, startMs, endMs, text}].
    """
    clips = []
    rate = SILENT_SAMPLE_RATE
    for slide in manifest["slides"]:
        narration = slide["narration"]
        if not narration:
            continue
        start_ms = slide["startMs"] + narration["leadInMs"]
        if voice is None:
            clips.append({"slide": slide, "samples": None, "startMs": start_ms, "audioMs": narration["estimatedMs"]})
            continue

        print(f"  TTS {slide['id']} …", end=" ", flush=True)
        samples, rate = voice.synthesize(narration["spokenText"])
        samples, factor = fit_to_slide(slide, samples, rate)
        audio_ms = len(samples) / rate * 1000
        note = f" (atempo {factor:.3f})" if factor > 1 else ""
        print(f"{audio_ms:.0f} / {narration['maxAudioMs']} ms{note}")
        clips.append({"slide": slide, "samples": samples, "startMs": start_ms, "audioMs": audio_ms})

    track = np.zeros(int(manifest["totalDurationMs"] / 1000 * rate), dtype="float32")
    for clip in clips:
        if clip["samples"] is None:
            continue
        offset = int(clip["startMs"] / 1000 * rate)
        end = min(len(track), offset + len(clip["samples"]))
        track[offset:end] += clip["samples"][: end - offset]

    output_file.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_file, np.clip(track, -1.0, 1.0), rate)

    return [
        {
            "id": clip["slide"]["id"],
            "startMs": clip["startMs"],
            "endMs": clip["startMs"] + min(clip["audioMs"], clip["slide"]["narration"]["maxAudioMs"]),
            "text": clip["slide"]["narration"]["displayText"],
        }
        for clip in clips
    ]


def write_srt(cues: list[dict], output_file: Path) -> Path:
    def ts(ms: float) -> str:
        ms = int(round(ms))
        h, rest = divmod(ms, 3_600_000)
        m, rest = divmod(rest, 60_000)
        s, ms = divmod(rest, 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"

    lines = []
    for i, cue in enumerate(cues, start=1):
        lines += [str(i), f"{ts(cue['startMs'])} --> {ts(cue['endMs'])}", cue["text"], ""]
    output_file.write_text("\n".join(lines), encoding="utf-8")
    return output_file
