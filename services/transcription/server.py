#!/usr/bin/env python3
"""
Transcription Service for RevampIT

A simple Flask server that provides speech-to-text using faster-whisper.
Runs locally, supports German (High German) and English.

Usage:
    ./services/transcription/.venv/bin/python services/transcription/server.py

API:
    POST /transcribe
        - Body: multipart/form-data with 'audio' file
        - Optional query param: ?language=de (de, en, or auto)
        - Optional query param: ?model=base (tiny, base, small, medium, large-v3)
        - Returns: { "text": "transcribed text", "language": "de", "duration": 5.2 }

    GET /health
        - Returns: { "status": "ok", "model": "base" }

    GET /models
        - Returns list of available Whisper models with metadata
"""

import os
import tempfile
import time
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel

app = Flask(__name__)

# Model configuration
DEVICE = "cpu"
COMPUTE_TYPE = "int8"  # int8 is fastest on CPU
DEFAULT_MODEL = os.environ.get("WHISPER_MODEL", "base")

ALLOWED_MODELS = {
    "tiny": {"label": "Tiny", "size": "~75 MB", "hint": "Schnellstes Modell, geringste Genauigkeit"},
    "base": {"label": "Base", "size": "~140 MB", "hint": "Guter Kompromiss aus Geschwindigkeit und Genauigkeit"},
    "small": {"label": "Small", "size": "~460 MB", "hint": "Bessere Genauigkeit, langsamer"},
    "medium": {"label": "Medium", "size": "~1.5 GB", "hint": "Hohe Genauigkeit, deutlich langsamer"},
    "large-v3": {"label": "Large v3", "size": "~3 GB", "hint": "Höchste Genauigkeit, sehr langsam auf CPU"},
}

# One model in memory at a time
_current_model = None
_current_model_name = None


def get_model(model_name=None):
    """Load a Whisper model, switching if a different one is requested."""
    global _current_model, _current_model_name

    if model_name is None:
        model_name = DEFAULT_MODEL

    if model_name not in ALLOWED_MODELS:
        model_name = DEFAULT_MODEL

    if _current_model is not None and _current_model_name == model_name:
        return _current_model

    print(f"Loading Whisper model: {model_name} on {DEVICE}...")
    _current_model = WhisperModel(model_name, device=DEVICE, compute_type=COMPUTE_TYPE)
    _current_model_name = model_name
    print(f"Model '{model_name}' loaded.")
    return _current_model


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model": _current_model_name or DEFAULT_MODEL,
        "device": DEVICE
    })


@app.route("/models", methods=["GET"])
def models():
    """Return available Whisper models with metadata."""
    model_list = []
    for model_id, meta in ALLOWED_MODELS.items():
        model_list.append({
            "id": model_id,
            "label": meta["label"],
            "size": meta["size"],
            "hint": meta["hint"],
            "active": model_id == (_current_model_name or DEFAULT_MODEL),
        })
    return jsonify({
        "models": model_list,
        "default": DEFAULT_MODEL,
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():
    """
    Transcribe audio file to text.

    Accepts multipart/form-data with 'audio' file.
    Optional query param 'language' (de, en, auto).
    Optional query param 'model' (tiny, base, small, medium, large-v3).
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    language = request.args.get("language", "de")  # Default to German
    requested_model = request.args.get("model")

    if language == "auto":
        language = None  # Let Whisper detect

    # Save to temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        start_time = time.time()
        model = get_model(requested_model)

        # Transcribe
        segments, info = model.transcribe(
            tmp_path,
            language=language,
            beam_size=5,
            vad_filter=True,  # Filter out silence
            vad_parameters=dict(
                min_silence_duration_ms=500,
            )
        )

        # Collect all segments
        text_parts = []
        for segment in segments:
            text_parts.append(segment.text.strip())

        full_text = " ".join(text_parts)
        duration = time.time() - start_time

        return jsonify({
            "text": full_text,
            "language": info.language,
            "language_probability": round(info.language_probability, 2),
            "duration_audio": round(info.duration, 2),
            "duration_processing": round(duration, 2),
            "model": _current_model_name,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    # Pre-load default model on startup
    print("Starting transcription service...")
    get_model()

    port = int(os.environ.get("PORT", 5111))
    print(f"Transcription service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
