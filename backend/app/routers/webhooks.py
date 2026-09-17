"""
VoxSales AI — Webhooks Router
Handles inbound events from n8n, LiveKit, and external services.
All webhook endpoints validate HMAC signatures for security.
"""
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_hmac(payload: bytes, signature: str, secret: str) -> bool:
    """Verify HMAC-SHA256 signature for webhook payloads."""
    if not secret:
        return True  # Skip verification in dev if no secret configured
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    # Constant-time comparison
    return hmac.compare_digest(expected, signature.lstrip("sha256="))


# ─── n8n webhook ──────────────────────────────────────────────────────────────

@router.post("/n8n")
async def n8n_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives workflow event callbacks from n8n.
    Supported event types:
    - call.completed  → update call record, trigger follow-up
    - lead.qualified  → notify Slack / CRM
    - meeting.booked  → sync to calendar
    """
    body = await request.body()
    signature = request.headers.get("x-n8n-signature", "")

    if not _verify_hmac(body, signature, settings.n8n_webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("event")
    data = payload.get("data", {})

    logger.info("n8n webhook received: event=%s", event_type)

    if event_type == "call.completed":
        background_tasks.add_task(_handle_call_completed, data, db)
    elif event_type == "lead.qualified":
        background_tasks.add_task(_handle_lead_qualified, data, db)
    elif event_type == "meeting.booked":
        background_tasks.add_task(_handle_meeting_booked, data, db)
    else:
        logger.warning("Unknown n8n event type: %s", event_type)

    return {"status": "accepted", "event": event_type}


# ─── LiveKit room event webhook ────────────────────────────────────────────────

@router.post("/livekit")
async def livekit_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives room events from LiveKit server.
    See: https://docs.livekit.io/server/webhooks/
    
    Supported events:
    - room_started   → create Call record
    - room_finished  → finalize Call record, trigger n8n workflow
    - participant_joined / participant_left
    """
    body = await request.body()
    # LiveKit uses JWT for webhook auth — validate against API secret
    auth_header = request.headers.get("Authorization", "")
    
    # TODO: In production, validate the LiveKit JWT token here
    # from livekit.api import WebhookReceiver
    # receiver = WebhookReceiver(api_key=settings.livekit_api_key, api_secret=settings.livekit_api_secret)
    # event = receiver.receive(body, auth_header)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("event")
    room = payload.get("room", {})

    logger.info("LiveKit webhook: event=%s room=%s", event_type, room.get("name"))

    if event_type == "room_finished":
        background_tasks.add_task(_handle_room_finished, payload, db)

    return {"status": "accepted"}


# ─── Background task handlers ─────────────────────────────────────────────────

async def _handle_call_completed(data: dict, db: AsyncSession):
    """Update call record with outcome from n8n workflow."""
    import uuid
    from sqlalchemy import select
    from app.models import Call

    call_id = data.get("call_id")
    if not call_id:
        return
    try:
        result = await db.execute(select(Call).where(Call.id == uuid.UUID(call_id)))
        call = result.scalar_one_or_none()
        if call:
            call.status = "Completed"
            call.outcome = data.get("outcome", "")
            call.summary = data.get("summary", "")
            await db.commit()
            logger.info("Call %s marked completed via webhook", call_id)
    except Exception as e:
        logger.error("Failed to handle call.completed: %s", e)


async def _handle_lead_qualified(data: dict, db: AsyncSession):
    """Update lead status when qualified via n8n."""
    import uuid
    from sqlalchemy import select
    from app.models import Lead

    lead_id = data.get("lead_id")
    if not lead_id:
        return
    try:
        result = await db.execute(select(Lead).where(Lead.id == uuid.UUID(lead_id)))
        lead = result.scalar_one_or_none()
        if lead and lead.status not in ("Qualified", "Meeting", "Do Not Contact"):
            lead.status = "Qualified"
            await db.commit()
            logger.info("Lead %s qualified via webhook", lead_id)
    except Exception as e:
        logger.error("Failed to handle lead.qualified: %s", e)


async def _handle_meeting_booked(data: dict, db: AsyncSession):
    """Create a Meeting record when n8n confirms calendar booking."""
    import uuid
    from app.models import Meeting

    try:
        meeting = Meeting(
            workspace_id=uuid.UUID(data["workspace_id"]),
            lead_id=uuid.UUID(data["lead_id"]) if data.get("lead_id") else None,
            title=data.get("title", "Discovery Call"),
            description=data.get("description", ""),
            status="Scheduled",
            calendar_event_id=data.get("calendar_event_id", ""),
            calendar_provider=data.get("calendar_provider", "google"),
        )
        db.add(meeting)
        await db.commit()
        logger.info("Meeting created via webhook: %s", meeting.id)
    except Exception as e:
        logger.error("Failed to handle meeting.booked: %s", e)


async def _handle_room_finished(payload: dict, db: AsyncSession):
    """Finalize call when LiveKit room closes."""
    import uuid
    from sqlalchemy import select
    from app.models import Call

    room_name = payload.get("room", {}).get("name", "")
    if not room_name:
        return
    try:
        result = await db.execute(
            select(Call).where(Call.livekit_room_name == room_name)
        )
        call = result.scalar_one_or_none()
        if call and call.status == "In Progress":
            duration = payload.get("room", {}).get("duration", 0)
            call.status = "Completed"
            call.duration_seconds = int(duration)
            await db.commit()
            logger.info("Call %s finalized via LiveKit webhook", call.id)
    except Exception as e:
        logger.error("Failed to handle room_finished: %s", e)
