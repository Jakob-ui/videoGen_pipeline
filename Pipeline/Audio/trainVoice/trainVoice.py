import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel
from datetime import datetime
from pathlib import Path


model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
    device_map="cpu",
    dtype=torch.float32,
)

voice_prompt = model.create_voice_clone_prompt(
    ref_audio="ressources/voice/my_voice.wav",
    ref_text="The exact sentence spoken in the recording.",
)