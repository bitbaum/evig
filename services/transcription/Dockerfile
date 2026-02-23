FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for faster-whisper
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir faster-whisper flask

# Copy server
COPY server.py .

# Pre-download the base model during build to avoid download at runtime
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"

ENV WHISPER_MODEL=base
ENV PORT=5111

EXPOSE 5111

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5111/health')" || exit 1

CMD ["python", "server.py"]
