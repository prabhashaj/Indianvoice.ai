"""
VoxSales AI — Agent Chat Router
POST /agents/{agent_id}/chat — send a message to an AI agent and get a real response.
Uses Mistral AI if key is configured, otherwise returns an error.
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.config import settings
from app.database import get_db
from app.models import Agent

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    agent_name: str


@router.post("/{agent_id}/chat", response_model=ChatResponse)
async def chat_with_agent(
    agent_id: str,
    body: ChatRequest,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a user message and receive a real AI reply from the configured agent."""

    # Fetch agent and verify ownership
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Agent not found")

    result = await db.execute(
        select(Agent).where(Agent.id == agent_uuid, Agent.workspace_id == ctx.workspace_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not settings.mistral_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI chat requires a Mistral API key. Add MISTRAL_API_KEY to your .env file.",
        )

    try:
        import httpx

        # Build a system prompt from the agent's config
        system_prompt = f"""You are {agent.name}, an AI voice sales representative.

Industry: {agent.industry or "B2B"}
Tone: {agent.tone or "Professional, consultative"}
Objective: {agent.objective or "Qualify leads and book product demos."}

Your opening line template: {agent.opening_script or "Hi, I'm calling from VoxSales AI. Do you have 30 seconds?"}

Qualification criteria: {agent.qualification_criteria or "Prospects who confirm budget authority and agree to a demo within 14 days."}

Instructions:
- Keep responses concise (2-4 sentences max, like a real phone call).
- Stay in character as a sales agent at all times.
- Handle objections naturally and steer towards booking a meeting or demo.
- Do NOT break character. Do NOT say you are an AI unless directly asked.
- Use the prospect's name if mentioned.
"""

        mistral_messages = [{"role": "system", "content": system_prompt}]
        for msg in body.messages:
            mistral_messages.append({"role": msg.role, "content": msg.content})

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.mistral_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.mistral_model,
                    "messages": mistral_messages,
                    "temperature": settings.mistral_temperature,
                    "max_tokens": settings.mistral_max_tokens,
                },
            )
            res.raise_for_status()
            data = res.json()
            reply = data["choices"][0]["message"]["content"].strip()
            return ChatResponse(reply=reply, agent_name=agent.name)

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Mistral API returned error {e.response.status_code}: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")
