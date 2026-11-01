import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel
from datetime import datetime
from pathlib import Path


class VoiceOverError(Exception):
    pass


def load_model():
    device = "cpu"
    dtype = torch.float32
    
    project_root = Path(__file__).resolve().parents[1]
    local_model_path = project_root / "models" / "qwen3-tts-1.7b-base"

    try:
        if local_model_path.is_dir():
            print(f"Loading local Model: {local_model_path}")
            model = Qwen3TTSModel.from_pretrained(
                str(local_model_path),
                device_map=device,
                dtype=dtype,
                local_files_only=True,
            )
        else:
            print("-------------------No local model, using online model-----------------------")
            model = Qwen3TTSModel.from_pretrained(
                "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
                device_map=device,
                dtype=dtype,
            )
    except Exception as error:
        raise VoiceOverError(
            f"Das TTS-Modell konnte nicht geladen werden: {error}"
        ) from error

    print(f"Model loaded on {device} with dtype {dtype}")
    return model


def generate_voiceover(text, output_path):
    if not text or not text.strip():
        raise VoiceOverError("Der Voice-over-Text darf nicht leer sein.")

    loaded_model = load_model()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = Path(f"{output_path}_{timestamp}.wav")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    print("Generating Voice-over, this could take some time...")

    try:
        voice_prompt = loaded_model.create_voice_clone_prompt(
        ref_audio="/home/jakob/dev/videoGen_pipeline/Pipeline/Audio/trainVoice/footage/Airspace_text_Ai.wav",
        ref_text="Sie merken es wahrscheinlich selbst. Flughäfen sind wieder gut besucht, Flugzeuge gut ausgelastet und die Menschen reisen gerne, sei es für den Urlaub, Geschäftsreisen oder um Familie und Freunde zu besuchen. Zwar war die Pandemie der größte Schock für die zivile Luftfahrt seit Jahrzehnten, doch inwischen hat sich der Luftverkehr weitgehend erholt. 2025 wurden in Europa wieder rund 11000000 Flüge registriert. Das entspricht durchschnisttlich mehr als 30.000 Flügen pro Tag. ",
        )
        wavs, sr = loaded_model.generate_voice_clone(
        text=text,
        language="German",
        voice_clone_prompt=voice_prompt,
        )
        sf.write(output_file, wavs[0], sr)
    except Exception as error:
        raise VoiceOverError(
            f"Das Voice-over konnte nicht erzeugt werden: {error}"
        ) from error

    if not output_file.exists() or output_file.stat().st_size == 0:
        raise VoiceOverError(
            f"Die Audiodatei wurde nicht korrekt erzeugt: {output_file}"
        )

    return output_file