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
