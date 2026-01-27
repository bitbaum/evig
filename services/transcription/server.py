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
        - Returns: { "text": "transcribed text", "language": "de", "duration": 5.2 }

    GET /health
        - Returns: { "status": "ok", "model": "base" }
"""

import os
import tempfile
import time
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel

app = Flask(__name__)

# Model configuration
# Options: tiny, base, small, medium, large-v3
# For CPU without GPU: base or small recommended for speed
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = "cpu"
COMPUTE_TYPE = "int8"  # int8 is fastest on CPU

# Lazy load model
_model = None

def get_model():
    """Lazy load the Whisper model."""
    global _model
    if _model is None:
        print(f"Loading Whisper model: {MODEL_SIZE} on {DEVICE}...")
        _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
        print("Model loaded.")
    return _model


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():
    """
    Transcribe audio file to text.

    Accepts multipart/form-data with 'audio' file.
    Optional query param 'language' (de, en, auto).
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    language = request.args.get("language", "de")  # Default to German

    if language == "auto":
        language = None  # Let Whisper detect

    # Save to temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        start_time = time.time()
        model = get_model()

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
            "duration_processing": round(duration, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    # Pre-load model on startup
    print("Starting transcription service...")
    get_model()

    port = int(os.environ.get("PORT", 5111))
    print(f"Transcription service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
