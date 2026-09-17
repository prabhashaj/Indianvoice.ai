# Indianvoice.ai — India's #1 AI Voice Sales Platform

> 🇮🇳 **Built for Bharat. Speaks Hindi. Speaks Telugu. Speaks English.**
> TRAI-compliant outbound AI calling at ₹0.30/min via Exotel.

---

## What is Indianvoice.ai?

**Indianvoice.ai** is an open-source, no-code AI voice sales platform that lets any Indian business deploy AI calling agents in **Hindi, Telugu, and English** — without writing a single line of code.

Think of it as an Indian-built alternative to [Vapi.ai](https://vapi.ai), but built specifically for the Indian market with:

| Feature | Vapi.ai | Indianvoice.ai |
|---------|---------|----------------|
| Hindi STT/TTS | ❌ Poor | ✅ Native (Sarvam AI) |
| Telugu support | ❌ None | ✅ Native (Sarvam AI) |
| Indian telephony | ❌ US-routed | ✅ Exotel (₹0.30/min) |
| TRAI compliance | ❌ None | ✅ Full NDNC + window |
| Hinglish support | ❌ None | ✅ Code-switch aware |
| WhatsApp follow-up | ❌ None | ✅ Built-in |
| Pricing | $0.05+/min (~₹4+) | ₹0.30/min |

---

## Architecture

This repository is organized into three main components:

```
Sales AI Command Center/
├── src/                  # Frontend — TanStack Start + React dashboard
├── backend/              # FastAPI REST API
└── voice-agent/          # Python LiveKit voice agent (STT→LLM→TTS pipeline)
```

---

## Frontend (No-Code Dashboard)

A modern React dashboard to manage campaigns, leads, calls, agents — all without code.

**Tech Stack:** TanStack Start, React, Tailwind CSS, Radix UI

```sh
# Install dependencies
npm install

# Start the development server (http://localhost:8080)
npm run dev
```

---

## Backend API (`/backend`)

High-performance FastAPI backend with Exotel telephony, TRAI compliance, and Indian language routing.

**Tech Stack:** FastAPI, SQLAlchemy, Exotel, LiveKit, Sarvam AI

```sh
cd backend

# Setup virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload --port 8000
```

**Key environment variables:**

```env
# Indian Telephony (Exotel)
EXOTEL_SID=your_sid
EXOTEL_API_KEY=your_key
EXOTEL_API_TOKEN=your_token
EXOTEL_CALLER_ID=+91XXXXXXXXXX

# Indian Language AI (Sarvam AI)
SARVAM_API_KEY=your_sarvam_key

# LLM
MISTRAL_API_KEY=your_mistral_key

# Voice (fallback)
ELEVENLABS_API_KEY=your_el_key

# LiveKit (audio infrastructure)
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

---

## Voice Agent (`/voice-agent`)

Real-time AI voice agent supporting Hindi/Telugu/English via LiveKit.

**Tech Stack:** Python, LiveKit Agents, Sarvam AI (STT/TTS), Mistral (LLM), Deepgram

**Supported Languages:**
- 🇮🇳 **Hindi** — Sarvam AI `saarika:v2` STT + `bulbul:v1` TTS
- 🇮🇳 **Telugu** — Sarvam AI native Telugu model
- 🇮🇳 **Hinglish** — Code-switch aware Hindi+English
- 🇮🇳 **English (India)** — Deepgram Nova-2 (en-IN)

```sh
cd voice-agent

# Setup virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Dev mode (auto-joins first room)
python agent.py dev

# Production mode
python agent.py start
```

**Key environment variables:**

```env
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
SARVAM_API_KEY=...
MISTRAL_API_KEY=...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
```

---

## TRAI Compliance

All outbound calls automatically enforce:

- ✅ **NDNC/DND scrubbing** before every call
- ✅ **9AM–9PM IST** calling window enforcement
- ✅ **Max 3 calls/week** per number (TRAI mandate)
- ✅ **One-click opt-out** management
- ✅ **DPDP Act 2023** data handling

---

## Indian Telephony (Exotel)

Outbound calls route via **Exotel** for Indian numbers (+91):
- Direct Jio/Airtel/BSNL/Vi PSTN routing
- ₹0.30–0.50/min (vs Twilio's ₹4+/min)
- Indian caller IDs
- Local latency (<200ms vs 600ms for US-routed)

---

## Deployment

A `docker-compose.yml` is included for full multi-container deployment.

```sh
docker-compose up --build
```

---

## Made with ❤️ for Bharat

- **STT/TTS:** [Sarvam AI](https://sarvam.ai) (Indian language AI)
- **Voice infra:** [LiveKit](https://livekit.io)
- **Telephony:** [Exotel](https://exotel.com)
- **LLM:** [Mistral AI](https://mistral.ai)
