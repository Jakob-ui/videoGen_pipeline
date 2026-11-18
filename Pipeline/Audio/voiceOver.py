"""Voice cloning TTS (Qwen3-TTS). Loads the model once and caches every generated sentence."""

import hashlib
from pathlib import Path

import numpy as np
import soundfile as sf

AUDIO_DIR = Path(__file__).resolve().parent
PIPELINE_DIR = AUDIO_DIR.parent
LOCAL_MODEL = PIPELINE_DIR / "models" / "qwen3-tts-1.7b-base"
ONLINE_MODEL = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"

REF_AUDIO = AUDIO_DIR / "trainVoice" / "footage" / "Airspace_text_Ai.wav"
REF_TEXT = (
    "Sie merken es wahrscheinlich selbst. Flughäfen sind wieder gut besucht, Flugzeuge gut ausgelastet "
    "und die Menschen reisen gerne, sei es für den Urlaub, Geschäftsreisen oder um Familie und Freunde zu "
    "besuchen. Zwar war die Pandemie der größte Schock für die zivile Luftfahrt seit Jahrzehnten, doch "
    "inwischen hat sich der Luftverkehr weitgehend erholt. zweitausendfünfundzwanzig wurden in Europa wieder "
    "rund elf Millionen Flüge registriert. Das entspricht durchschnisttlich mehr als dreißigtausend Flügen pro Tag. "
)


class VoiceOverError(Exception):
    pass


class VoiceOver:
    """synthesize(text) → (samples as float32 mono, sample_rate). Results are cached on disk."""

    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._model = None
        self._prompt = None

    def _load(self):
        if self._model is not None:
            return
        import torch
        from qwen_tts import Qwen3TTSModel

        device = "cpu"
        dtype = torch.float32
        source = str(LOCAL_MODEL) if LOCAL_MODEL.is_dir() else ONLINE_MODEL
        print(f"  TTS-Modell laden: {source} ({device}, {dtype})")
        try:
            self._model = Qwen3TTSModel.from_pretrained(
                source, device_map=device, dtype=dtype, local_files_only=LOCAL_MODEL.is_dir()
            )
            self._prompt = self._model.create_voice_clone_prompt(ref_audio=str(REF_AUDIO), ref_text=REF_TEXT)
        except Exception as error:
            raise VoiceOverError(f"Das TTS-Modell konnte nicht geladen werden: {error}") from error

    def synthesize(self, text: str) -> tuple[np.ndarray, int]:
        if not text or not text.strip():
            raise VoiceOverError("Der Voice-over-Text darf nicht leer sein.")

        key = hashlib.sha1(f"{ONLINE_MODEL}|{REF_AUDIO.name}|{text}".encode()).hexdigest()[:16]
        cached = self.cache_dir / f"{key}.wav"
        if cached.is_file():
            samples, rate = sf.read(cached, dtype="float32")
            return samples, rate

        self._load()
        try:
            wavs, rate = self._model.generate_voice_clone(
                text=text, language="German", voice_clone_prompt=self._prompt
            )
        except Exception as error:
            raise VoiceOverError(f"Das Voice-over konnte nicht erzeugt werden: {error}") from error

        samples = np.asarray(wavs[0], dtype="float32")
        if samples.ndim > 1:
            samples = samples.mean(axis=1)
        sf.write(cached, samples, rate)
        return samples, rate
