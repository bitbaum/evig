#!/bin/bash
# Start the transcription service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate venv and run
source .venv/bin/activate
export WHISPER_MODEL="${WHISPER_MODEL:-base}"
export PORT="${PORT:-5111}"

echo "Starting transcription service with model: $WHISPER_MODEL"
python server.py
