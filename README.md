# Indianvoice.ai - Sales AI Command Center

The **Sales AI Command Center** is a comprehensive platform for managing and deploying AI-powered voice agents for sales and customer interactions. It features a full-stack architecture with a modern web dashboard, a robust backend API, and a real-time voice agent service.

## Project Structure

This repository is organized into three main components:

1. **Frontend** (Root directory)
2. **Backend API** (`/backend`)
3. **Voice Agent** (`/voice-agent`)

### Frontend (Dashboard)
A modern, responsive web application built to manage campaigns, leads, calls, and agent configurations.

**Tech Stack:**
- **Framework:** TanStack Start & React
- **Styling:** Tailwind CSS & Radix UI primitives
- **Routing:** TanStack Router

**Getting Started:**
```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Backend API (`/backend`)
A high-performance REST API that handles data persistence, business logic, authentication, and webhooks for telephony providers (e.g., Twilio, Telnyx).

**Tech Stack:**
- **Framework:** FastAPI
- **Database:** SQLAlchemy, asyncpg (PostgreSQL), Alembic (Migrations)
- **Background Tasks:** Redis & ARQ

**Getting Started:**
```sh
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload
```

### Voice Agent (`/voice-agent`)
Real-time conversational AI agents powered by LiveKit, enabling low-latency voice interactions with users.

**Tech Stack:**
- **Framework:** LiveKit Agents
- **STT/TTS/LLM:** Deepgram, Cartesia, ElevenLabs, Mistral (via OpenAI API)

**Getting Started:**
```sh
cd voice-agent

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Run the agent
python agent.py start
```

## Environment Variables

Each component requires its own set of environment variables. Reference the `.env.example` files in the respective directories, create local `.env` files, and populate them with your API keys (e.g., LiveKit, LLM providers, Twilio, database credentials).

## Deployment

A `docker-compose.yml` is provided at the root for orchestrated multi-container deployment, allowing you to easily spin up the frontend, backend, voice-agent, and required infrastructure (like Redis or PostgreSQL) simultaneously.
