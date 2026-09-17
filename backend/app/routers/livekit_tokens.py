"""
VoxSales AI — LiveKit Token Router
POST /livekit/token — Issues a secure LiveKit access token for browser voice sessions.
POST /livekit/agent-dispatch — Dispatches the AI agent to a room (internal use).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.config import settings
from app.database import get_db
from app.models import Agent, Call

router = APIRouter()


class TokenRequest(BaseModel):
    agent_id: str
    session_type: str = "test"  # "test" | "campaign_call"
    call_id: str | None = None


class TokenResponse(BaseModel):
    token: str
    room_name: str
    livekit_url: str
    call_id: str


@router.post("/token", response_model=TokenResponse)
async def get_livekit_token(
    body: TokenRequest,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Issues a LiveKit access token for a browser participant.
    Creates a Call record if session_type is 'test'.
    The AI voice agent will join the same room via the voice-agent service.
    """
    if not settings.livekit_configured:
        raise HTTPException(
            status_code=503,
            detail="LiveKit is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET to your environment.",
        )

    # Verify agent belongs to workspace
    agent = None
    try:
        agent_uuid = uuid.UUID(body.agent_id)
        agent_result = await db.execute(
            select(Agent).where(
                Agent.id == agent_uuid,
                Agent.workspace_id == ctx.workspace_id,
            )
        )
        agent = agent_result.scalar_one_or_none()
    except (ValueError, AttributeError):
        pass

    if not agent:
        agent_result = await db.execute(
            select(Agent).where(
                Agent.workspace_id == ctx.workspace_id,
                Agent.name.ilike(f"%{body.agent_id}%"),
            )
        )
        agent = agent_result.scalars().first()

    if not agent:
        agent_result = await db.execute(
            select(Agent).where(Agent.workspace_id == ctx.workspace_id)
        )
        agent = agent_result.scalars().first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Create a unique room name
    room_name = f"voxsales-{ctx.workspace_id}-{uuid.uuid4().hex[:12]}"

    # Create a test Call record for traceability
    if body.session_type == "test":
        call = Call(
            workspace_id=ctx.workspace_id,
            agent_id=agent.id,
            livekit_room_name=room_name,
            status="Pending",
        )
        db.add(call)
        await db.commit()
        await db.refresh(call)
        call_id = str(call.id)
    else:
        call_id = body.call_id or str(uuid.uuid4())

    # Generate LiveKit token
    try:
        try:
            from livekit.api import AccessToken, VideoGrants

            token = (
                AccessToken(
                    api_key=settings.livekit_api_key,
                    api_secret=settings.livekit_api_secret,
                )
                .with_identity(f"user-{ctx.user_id}")
                .with_name("Sales Rep")
                .with_grants(
                    VideoGrants(
                        room_join=True,
                        room=room_name,
                        can_publish=True,
                        can_subscribe=True,
                    )
                )
            )
            jwt_token = token.to_jwt()
        except ImportError:
            import time
            from jose import jwt

            now = int(time.time())
            claims = {
                "sub": f"user-{ctx.user_id}",
                "name": "Sales Rep",
                "iss": settings.livekit_api_key,
                "nbf": now - 5,
                "exp": now + 24 * 3600,
                "video": {
                    "roomJoin": True,
                    "room": room_name,
                    "canPublish": True,
                    "canSubscribe": True,
                },
            }
            jwt_token = jwt.encode(claims, settings.livekit_api_secret, algorithm="HS256")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create LiveKit token: {e}")

    return TokenResponse(
        token=jwt_token,
        room_name=room_name,
        livekit_url=settings.livekit_url,
        call_id=call_id,
    )
