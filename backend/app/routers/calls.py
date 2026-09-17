"""
VoxSales AI — Calls Router
Read-only for the frontend; write access via internal endpoints called by voice-agent.
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.database import get_db
from app.models import Call, CallTranscriptLine

router = APIRouter()


class TranscriptLineResponse(BaseModel):
    id: str
    speaker: str
    text: str
    offset_seconds: float
    is_highlight: bool


class CallResponse(BaseModel):
    id: str
    workspace_id: str
    campaign_id: Optional[str]
    agent_id: Optional[str]
    lead_id: Optional[str]
    livekit_room_name: str
    status: str
    outcome: str
    duration_seconds: int
    sentiment: str
    intent_score: int
    lead_score: int
    summary: str
    analysis: List[str]
    topics: List[str]
    objections: List[str]
    next_action: str
    transcript: List[TranscriptLineResponse] = []

    @classmethod
    def from_orm(cls, call: Call, include_transcript: bool = False) -> "CallResponse":
        transcript = []
        if include_transcript and call.transcript_lines:
            transcript = [
                TranscriptLineResponse(
                    id=str(t.id),
                    speaker=t.speaker,
                    text=t.text,
                    offset_seconds=t.offset_seconds,
                    is_highlight=t.is_highlight,
                )
                for t in call.transcript_lines
            ]
        return cls(
            id=str(call.id),
            workspace_id=str(call.workspace_id),
            campaign_id=str(call.campaign_id) if call.campaign_id else None,
            agent_id=str(call.agent_id) if call.agent_id else None,
            lead_id=str(call.lead_id) if call.lead_id else None,
            livekit_room_name=call.livekit_room_name,
            status=call.status,
            outcome=call.outcome,
            duration_seconds=call.duration_seconds,
            sentiment=call.sentiment,
            intent_score=call.intent_score,
            lead_score=call.lead_score,
            summary=call.summary,
            analysis=call.analysis or [],
            topics=call.topics or [],
            objections=call.objections or [],
            next_action=call.next_action,
            transcript=transcript,
        )


@router.get("", response_model=List[CallResponse])
async def list_calls(
    campaign_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    status: Optional[str] = None,
    outcome: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Call).where(Call.workspace_id == ctx.workspace_id)
    if campaign_id:
        try:
            stmt = stmt.where(Call.campaign_id == uuid.UUID(campaign_id))
        except Exception:
            return []
    if lead_id:
        try:
            stmt = stmt.where(Call.lead_id == uuid.UUID(lead_id))
        except Exception:
            return []
    if agent_id:
        try:
            stmt = stmt.where(Call.agent_id == uuid.UUID(agent_id))
        except Exception:
            return []
    if status:
        stmt = stmt.where(Call.status == status)
    if outcome:
        stmt = stmt.where(Call.outcome == outcome)
    stmt = stmt.order_by(Call.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [CallResponse.from_orm(c) for c in result.scalars().all()]


def _parse_call_uuid(call_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(call_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Call not found. Please verify the URL.")


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    call_uuid = _parse_call_uuid(call_id)
    result = await db.execute(
        select(Call).where(
            Call.id == call_uuid,
            Call.workspace_id == ctx.workspace_id,
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found. Please verify the URL.")
    # Eagerly load transcript lines
    transcript_result = await db.execute(
        select(CallTranscriptLine)
        .where(CallTranscriptLine.call_id == call.id)
        .order_by(CallTranscriptLine.offset_seconds)
    )
    call.transcript_lines = transcript_result.scalars().all()
    return CallResponse.from_orm(call, include_transcript=True)


@router.patch("/{call_id}")
async def patch_call(
    call_id: str,
    body: dict,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Internal endpoint used by the voice-agent service to update call status,
    outcome, intent score, and analysis at the end of a session.
    """
    call_uuid = _parse_call_uuid(call_id)
    result = await db.execute(
        select(Call).where(
            Call.id == call_uuid,
            Call.workspace_id == ctx.workspace_id,
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found. Please verify the URL.")

    allowed_fields = {
        "status", "outcome", "intent_score", "lead_score", "sentiment",
        "summary", "analysis", "topics", "objections", "next_action",
        "duration_seconds",
    }
    for field, value in body.items():
        if field in allowed_fields:
            setattr(call, field, value)

    await db.commit()
    return {"id": call_id, "updated": True}


@router.post("/{call_id}/transcript")
async def add_transcript_line(
    call_id: str,
    body: dict,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Internal endpoint for voice-agent to stream transcript lines."""
    result = await db.execute(
        select(Call).where(
            Call.id == uuid.UUID(call_id),
            Call.workspace_id == ctx.workspace_id,
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    line = CallTranscriptLine(
        call_id=call.id,
        speaker=body.get("speaker", "AI"),
        text=body.get("text", ""),
        offset_seconds=body.get("offset_seconds", 0.0),
        is_highlight=body.get("is_highlight", False),
    )
    db.add(line)
    await db.commit()
    return {"id": str(line.id)}
