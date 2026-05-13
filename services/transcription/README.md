# Transcription Service

Local speech-to-text service using [faster-whisper](https://github.com/SYSTRAN/faster-whisper).

## Quick Start

```bash
# First time setup
npm run transcription:setup

# Start the service
npm run transcription:start
```

The service runs on `http://localhost:5111` by default.

## Local file workflow

Use this for larger recordings or private meeting audio that should stay local.
Start the service first, then transcribe the file to a text transcript that can
be pasted or uploaded in the Admin Protocols flow.

```bash
npm run transcription:start

npm run transcribe:local -- "/path/to/recording.m4a" --model small --language de
```

The helper writes `recording.transcript.txt` plus `recording.transcript.json`
next to the audio file unless `--output` is provided.

## API Endpoints

### GET /health
Health check endpoint.

```bash
curl http://localhost:5111/health
```

### POST /transcribe
Transcribe audio file to text.

```bash
curl -X POST http://localhost:5111/transcribe \
  -F "audio=@recording.wav" \
  -G -d "language=de"
```

**Parameters:**
- `audio` (required): Audio file (wav, mp3, webm, etc.)
- `language` (optional): Language code (`de`, `en`, or `auto`). Default: `de`

**Response:**
```json
{
  "text": "Transcribed text here",
  "language": "de",
  "language_probability": 0.98,
  "duration_audio": 5.2,
  "duration_processing": 2.1
}
```

## Configuration

Environment variables:
- `WHISPER_MODEL`: Model size (`tiny`, `base`, `small`, `medium`, `large-v3`). Default: `base`
- `PORT`: Server port. Default: `5111`

For better accuracy with slower speed:
```bash
WHISPER_MODEL=small npm run transcription:start
```

## Models

| Model | Size | Speed (CPU) | Accuracy |
|-------|------|-------------|----------|
| tiny | 75 MB | Very fast | Lower |
| base | 142 MB | Fast | Good |
| small | 466 MB | Moderate | Better |
| medium | 1.5 GB | Slow | High |
| large-v3 | 3 GB | Very slow | Highest |

For CPU-only (no GPU), `base` or `small` is recommended.

## Swiss German

For Swiss German transcription of meetings/recordings, see the fine-tuned models:
- [Flurin17/whisper-large-v3-peft-swiss-german](https://huggingface.co/Flurin17/whisper-large-v3-peft-swiss-german)

For quick product entry, use High German - standard Whisper handles it well.
