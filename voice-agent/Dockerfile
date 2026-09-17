FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Silero VAD model at build time (avoid runtime cold start)
RUN python -c "from silero_vad import load_silero_vad; load_silero_vad()" || true

COPY . .

CMD ["python", "agent.py", "start"]
