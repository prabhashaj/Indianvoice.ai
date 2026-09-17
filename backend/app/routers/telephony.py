"""
VoxSales AI — Telephony Router (LiveKit Twilio Connector)

Outbound call flow:
  1. Backend creates a LiveKit room and dispatches the AI voice agent.
  2. Backend calls lk_api.connector.connect_twilio_call() → gets a WebSocket connect_url.
  3. Backend calls Twilio REST API with inline TwiML:
       <Connect><Stream url="<connect_url>" /></Connect>
     Twilio dials the lead, audio streams bidirectionally to LiveKit via WebSocket.
  4. The AI agent talks directly to the lead inside the LiveKit room.

This approach works with Twilio trial accounts and requires:
  LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
"""
import json
import logging
import uuid
import xml.sax.saxutils as saxutils
from typing import Optional

import urllib.parse
from datetime import datetime

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from requests.auth import HTTPBasicAuth
from sqlalchemy import select

from ..auth import AuthContext, get_current_user
from ..config import settings
from ..database import AsyncSessionLocal
from ..models import Agent, Call, Lead

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pydantic models ─────────────────────────────────────────────────────────

class OutboundCallRequest(BaseModel):
    to_phone: str
    lead_id: Optional[str] = None
    agent_id: Optional[str] = None
    custom_message: Optional[str] = None


class TelephonyStatusResponse(BaseModel):
    provider: str
    configured: bool
    phone_number: str
    account_sid: str
    account_status: str
    account_friendly_name: str


# ─── LiveKit helpers ─────────────────────────────────────────────────────────

async def _dispatch_voice_agent(
    room_name: str,
    agent_config: dict,
    workspace_id: str,
) -> bool:
    """
    Create a LiveKit room and dispatch the VoxSales AI voice agent into it.
    Voice-agent worker must be running: cd voice-agent && python agent.py start
    """
    if not settings.livekit_configured:
        logger.warning("LiveKit not configured — cannot dispatch agent")
        return False

    try:
        from livekit.api import LiveKitAPI, CreateRoomRequest, CreateAgentDispatchRequest

        async with LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        ) as lk_api:
            metadata = json.dumps(agent_config)

            await lk_api.room.create_room(
                CreateRoomRequest(
                    name=room_name,
                    metadata=metadata,
                    empty_timeout=300,
                    max_participants=10,
                )
            )

            await lk_api.agent_dispatch.create_dispatch(
                CreateAgentDispatchRequest(
                    agent_name="voxsales-agent",
                    room=room_name,
                    metadata=metadata,
                )
            )

        logger.info("✅ Voice agent dispatched to room: %s", room_name)
        return True

    except ImportError:
        logger.error("livekit-api not installed. Run: pip install livekit-api")
        return False
    except Exception as e:
        logger.error("Failed to dispatch voice agent: %s", e, exc_info=True)
        return False


async def _get_twilio_connect_url(
    room_name: str,
    participant_identity: str,
    participant_name: str,
) -> Optional[str]:
    """
    Call LiveKit Twilio Connector API to get a WebSocket URL.
    This URL is passed to Twilio's TwiML <Connect><Stream> verb.

    Returns the connect_url string on success, or None on failure.
    """
    if not settings.livekit_configured:
        return None

    try:
        from livekit.api import LiveKitAPI, ConnectTwilioCallRequest

        async with LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        ) as lk_api:
            resp = await lk_api.connector.connect_twilio_call(
                ConnectTwilioCallRequest(
                    room_name=room_name,
                    participant_identity=participant_identity,
                    participant_name=participant_name,
                    # twilio_call_direction: 0=inbound, 1=outbound (default)
                )
            )
            url = resp.connect_url
            logger.info("✅ Twilio connect URL obtained: %s", url[:60] + "...")
            return url

    except ImportError:
        logger.error("livekit-api ConnectorService not available — upgrade SDK")
        return None
    except Exception as e:
        logger.error("Failed to get Twilio connect URL: %s", e, exc_info=True)
        return None


def _build_connector_twiml(connect_url: str) -> str:
    """
    Build TwiML that bridges the Twilio call into LiveKit via WebSocket stream.
    Uses <Connect><Stream> instead of SIP dial — works on trial accounts.
    """
    safe_url = saxutils.escape(connect_url)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        "    <Connect>\n"
        f'        <Stream url="{safe_url}" />\n'
        "    </Connect>\n"
        "</Response>"
    )


def _build_fallback_twiml(opening_line: str) -> str:
    """Static TTS fallback when LiveKit connector is unavailable."""
    safe_text = saxutils.escape(opening_line) if opening_line else "Hello from VoxSales AI!"
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f'    <Say voice="Polly.Joanna-Neural">{safe_text}</Say>\n'
        '    <Pause length="1"/>\n'
        "</Response>"
    )


def _build_sip_twiml(room_name: str, opening_line: str = "") -> str:
    """Build TwiML for legacy inbound SIP bridging (kept for backward compat)."""
    sip_host = settings.livekit_sip_ingest_host
    if not sip_host and settings.livekit_url:
        host = settings.livekit_url.replace("wss://", "").replace("ws://", "").split("/")[0]
        sip_host = host

    sip_uri = f"sip:{urllib.parse.quote(room_name)}@{sip_host}"
    safe_opening = saxutils.escape(opening_line) if opening_line else ""
    say_block = (
        f'    <Say voice="Polly.Joanna-Neural">{safe_opening}</Say>\n    <Pause length="1"/>\n'
        if safe_opening else ""
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f"{say_block}"
        "    <Dial>\n"
        f"        <Sip>{sip_uri}</Sip>\n"
        "    </Dial>\n"
        "</Response>"
    )


# ─── Telephony status ─────────────────────────────────────────────────────────

@router.get("/status", response_model=TelephonyStatusResponse)
async def get_telephony_status(ctx: AuthContext = Depends(get_current_user)):
    """Returns current telephony integration status."""
    configured = settings.twilio_configured and settings.livekit_configured

    account_status = "unconfigured"
    account_friendly_name = "Not configured"

    if configured:
        try:
            res = requests.get(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}.json",
                auth=HTTPBasicAuth(settings.twilio_account_sid, settings.twilio_auth_token),
                timeout=5,
            )
            if res.status_code == 200:
                data = res.json()
                account_status = data.get("status", "active")
                account_friendly_name = data.get("friendly_name", "Twilio Account")
            else:
                account_status = "error"
                account_friendly_name = f"HTTP {res.status_code}"
        except Exception as e:
            logger.warning("Could not fetch Twilio account status: %s", e)
            account_status = "unknown"
            account_friendly_name = "Twilio (status unavailable)"

    return TelephonyStatusResponse(
        provider="twilio+livekit",
        configured=configured,
        phone_number=settings.twilio_phone_number,
        account_sid=settings.twilio_account_sid[:10] + "..." if settings.twilio_account_sid else "",
        account_status=account_status,
        account_friendly_name=account_friendly_name,
    )


# ─── Outbound call ────────────────────────────────────────────────────────────

# Track participant identities for cleanup
_active_call_participants: dict[str, str] = {}

# Store pending TwiML payloads with timestamps — expires after 5 minutes
# Stored as {token: (twiml_string, created_at_timestamp)}
_pending_twiml: dict[str, tuple[str, float]] = {}


def _cleanup_expired_twiml():
    """Remove TwiML entries older than 5 minutes."""
    import time
    now = time.time()
    expired = [k for k, (_, ts) in _pending_twiml.items() if now - ts > 300]
    for k in expired:
        del _pending_twiml[k]


@router.get("/twiml-callback/{token}")
@router.post("/twiml-callback/{token}")
async def twiml_callback(token: str):
    """
    TwiML endpoint fetched by Twilio when an outbound call connects.
    Returns the pre-built LiveKit Stream TwiML. Expires after 5 minutes.
    Allows multiple fetches (Twilio may retry) within the TTL window.
    """
    import time
    _cleanup_expired_twiml()
    entry = _pending_twiml.get(token)
    if entry:
        twiml, _ = entry
        logger.info("TwiML served for token: %s", token[:8])
        return Response(content=twiml, media_type="application/xml")
    # Token expired or unknown
    logger.warning("TwiML token not found or expired: %s", token[:8])
    twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this call session has expired. Please try again.</Say></Response>'
    return Response(content=twiml, media_type="application/xml")



@router.post("/telnyx-webhook")
async def telnyx_webhook(request: Request):
    """
    Handles Telnyx Call Control webhook events.
    When a call is answered, we issue a SIP transfer command to bridge
    the call audio into the LiveKit SIP ingest endpoint.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "ignored"}

    event_type = body.get("data", {}).get("event_type", "")
    payload = body.get("data", {}).get("payload", {})
    call_control_id = payload.get("call_control_id", "")
    client_state_raw = payload.get("client_state", "")
    logger.info("Telnyx webhook event: %s call_control_id=%s", event_type, call_control_id[:16] if call_control_id else "")

    if event_type == "call.initiated" or event_type == "call.answered":
        # Decode client_state to get the SIP URI for LiveKit
        try:
            import base64
            state = json.loads(base64.b64decode(client_state_raw).decode()) if client_state_raw else {}
        except Exception:
            state = {}

        sip_uri = state.get("sip_uri", "")
        room_name = state.get("room", "")

        if event_type == "call.answered" and call_control_id and sip_uri:
            # Issue a SIP Refer (transfer) to bridge this call into LiveKit
            transfer_url = f"https://api.telnyx.com/v2/calls/{call_control_id}/actions/transfer"
            transfer_payload = {
                "to": sip_uri,
                "sip_headers": [
                    {"name": "X-LiveKit-Room", "value": room_name},
                ],
            }
            tr = requests.post(
                transfer_url,
                json=transfer_payload,
                headers={"Authorization": f"Bearer {settings.telnyx_api_key}"},
                timeout=10,
            )
            logger.info(
                "SIP transfer to LiveKit: status=%s room=%s sip=%s",
                tr.status_code, room_name, sip_uri,
            )

    return {"status": "ok"}


@router.post("/outbound-call")
async def initiate_outbound_call(
    body: OutboundCallRequest,
    request: Request,
    ctx: AuthContext = Depends(get_current_user),
):
    """
    Initiates a real-time AI outbound call via LiveKit Twilio Connector.

    Flow:
      1. Dispatch AI voice agent into a new LiveKit room.
      2. Get a WebSocket connect_url from lk_api.connector.connect_twilio_call().
      3. Twilio dials the lead with TwiML <Connect><Stream url=connect_url />.
      4. Audio streams bidirectionally: Phone ↔ Twilio ↔ LiveKit ↔ AI Agent.
    """
    if not settings.telnyx_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "Telnyx is not configured. "
                "Set TELNYX_API_KEY and TELNYX_PHONE_NUMBER in .env"
            ),
        )
    if not settings.livekit_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "LiveKit is not configured. "
                "Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env"
            ),
        )

    # ── Load agent + lead ────────────────────────────────────────────────────
    agent_name = "Alex"
    agent_obj = None
    lead_obj = None
    opening_script = ""
    lead_uuid = None
    agent_uuid = None

    try:
        if body.lead_id:
            try:
                lead_uuid = uuid.UUID(body.lead_id)
            except Exception:
                pass
        if body.agent_id:
            try:
                agent_uuid = uuid.UUID(body.agent_id)
            except Exception:
                pass

        async with AsyncSessionLocal() as db_session:
            if lead_uuid:
                lead_res = await db_session.execute(
                    select(Lead).where(Lead.id == lead_uuid)
                )
                lead_obj = lead_res.scalar_one_or_none()
            if agent_uuid:
                agent_res = await db_session.execute(
                    select(Agent).where(Agent.id == agent_uuid)
                )
                agent_obj = agent_res.scalar_one_or_none()

    except Exception as e:
        logger.warning("Could not load agent/lead details: %s", e)

    if agent_obj:
        agent_name = agent_obj.name or agent_name
        opening_script = body.custom_message or getattr(agent_obj, "opening_script", "") or ""

    if not opening_script:
        lead_name = lead_obj.name if lead_obj else ""
        greeting = f"Hello {lead_name}!" if lead_name else "Hello!"
        opening_script = (
            f"{greeting} This is {agent_name} calling from VoxSales AI. "
            "Do you have 30 seconds? I'd love to tell you how we help sales teams "
            "book more qualified meetings using AI."
        )

    # ── Build agent config ───────────────────────────────────────────────────
    call_id = str(uuid.uuid4())
    agent_config = {
        "workspace_id": str(ctx.workspace_id),
        "agent_id": str(agent_uuid) if agent_uuid else "",
        "lead_id": str(lead_uuid) if lead_uuid else "",
        "call_id": call_id,
        "agent_name": agent_name,
        "company_name": "VoxSales AI",
        "objective": getattr(agent_obj, "objective", "") or "Qualify leads and book demos",
        "opening_script": opening_script,
        "qualification_criteria": getattr(agent_obj, "qualification_criteria", "") or "",
        "tone": getattr(agent_obj, "tone", "") or "Professional, consultative",
        "lead_name": lead_obj.name if lead_obj else "",
        "lead_company": lead_obj.company if lead_obj else "",
        "lead_title": lead_obj.title if lead_obj else "",
        "llm_provider": "mistral",
        "mistral_model": settings.mistral_model,
        "tts_voice": "nova",
    }

    # ── Step 1: Create LiveKit room + dispatch AI agent ──────────────────────
    room_name = f"voxsales-call-{uuid.uuid4().hex[:12]}"
    agent_dispatched = await _dispatch_voice_agent(
        room_name=room_name,
        agent_config=agent_config,
        workspace_id=str(ctx.workspace_id),
    )
    if not agent_dispatched:
        logger.warning(
            "Voice agent not dispatched to room %s. "
            "Is voice-agent running? cd voice-agent && python agent.py start",
            room_name,
        )

    # ── Step 2: Build TwiML using <Dial><Sip> → LiveKit SIP ingest ───────────
    # <Connect><Stream> is blocked on Twilio trial accounts.
    # <Dial><Sip> routes the call into LiveKit's SIP ingest — works on all plans.
    participant_identity = f"twilio-lead-{uuid.uuid4().hex[:8]}"
    lk_host = settings.livekit_url.replace("wss://", "").replace("ws://", "").split("/")[0]
    lk_sip_host = lk_host.replace(".livekit.cloud", ".sip.livekit.cloud")
    sip_uri = f"sip:{urllib.parse.quote(room_name)}@{lk_sip_host}"
    twiml_content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        "    <Dial>\n"
        f"        <Sip>{saxutils.escape(sip_uri)}</Sip>\n"
        "    </Dial>\n"
        "</Response>"
    )
    mode = "sip_dial"
    logger.info(
        "Placing Telnyx call via SIP to LiveKit: room=%s sip=%s to=%s",
        room_name, sip_uri, body.to_phone,
    )

    # ── Step 3: Place call via Telnyx Call Control API (v2) ─────────────────
    # The call is placed as a SIP call directly to LiveKit's SIP ingest.
    # Telnyx will call the lead, and when answered, bridge to LiveKit via SIP.
    try:
        telnyx_url = "https://api.telnyx.com/v2/calls"

        call_payload_json: dict = {
            "to": body.to_phone,
            "from": settings.telnyx_phone_number,
            "from_display_name": "VoxSales AI",
            "connection_id": settings.telnyx_connection_id,
            "answering_machine_detection": "disabled",
            "timeout_secs": 60,
            # When the call is answered, Telnyx will POST to our webhook
            # We handle the `call.answered` event there and issue a SIP transfer
            "webhook_url": f"{(settings.public_webhook_url or '').rstrip('/')}/telephony/telnyx-webhook",
            "webhook_url_method": "POST",
            "custom_headers": [],
            "client_state": __import__("base64").b64encode(json.dumps({
                "room": room_name,
                "sip_uri": sip_uri,
            }).encode()).decode(),
        }

        res = requests.post(
            telnyx_url,
            json=call_payload_json,
            headers={"Authorization": f"Bearer {settings.telnyx_api_key}"},
            timeout=10,
        )

        if res.status_code in (200, 201):
            call_data = res.json().get("data", {})
            call_sid = call_data.get("call_session_id", call_data.get("call_leg_id", ""))
            _active_call_participants[call_sid] = participant_identity

            logger.info(
                "✅ Call placed: SID=%s to=%s room=%s mode=%s",
                call_sid, body.to_phone, room_name, mode,
            )

            # ── Persist call record ──────────────────────────────────────────
            try:
                async with AsyncSessionLocal() as db_session:
                    new_call = Call(
                        workspace_id=ctx.workspace_id,
                        lead_id=lead_uuid,
                        agent_id=agent_uuid,
                        livekit_room_name=room_name,
                        status="In Progress",
                        outcome=(
                            "Real-time AI via SIP Ingest"
                            if mode == "sip_dial"
                            else "TTS-only call"
                        ),
                        started_at=datetime.utcnow(),
                        summary=(
                            f"Outbound AI call to {body.to_phone}. "
                            f"Room: {room_name}. Mode: {mode}"
                        ),
                        topics=["Outbound Sales", "Lead Qualification"],
                        sentiment="Neutral",
                        intent_score=75,
                    )
                    db_session.add(new_call)

                    if lead_uuid:
                        l_res = await db_session.execute(
                            select(Lead).where(Lead.id == lead_uuid)
                        )
                        lead_row = l_res.scalar_one_or_none()
                        if lead_row:
                            lead_row.status = "Contacted"
                            lead_row.last_contacted_at = datetime.utcnow()

                    await db_session.commit()
            except Exception as db_err:
                logger.warning("Could not persist call record: %s", db_err)

            note = (
                "🟢 Real-time AI voice agent active — Lead ↔ Telnyx ↔ LiveKit SIP ↔ Agent"
                if mode == "sip_dial"
                else "🟡 TTS-only mode."
            )

            return {
                "status": "initiated",
                "call_sid": call_sid,
                "call_id": call_id,
                "to": body.to_phone,
                "from": settings.telnyx_phone_number,
                "telnyx_status": call_data.get("status"),
                "livekit_room": room_name,
                "agent_dispatched": agent_dispatched,
                "connector_active": mode == "sip_dial",
                "note": note,
                "note": note,
            }

        else:
            err = (
                res.json()
                if res.headers.get("content-type", "").startswith("application/json")
                else {"message": res.text}
            )
            logger.error("Twilio call failed: %s", err)
            raise HTTPException(
                status_code=res.status_code,
                detail=f"Twilio error: {err.get('message', res.text)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error initiating outbound call: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to place call: {str(e)}")


# ─── Status callback ──────────────────────────────────────────────────────────

@router.post("/status-callback")
async def status_callback(request: Request):
    """Twilio status callback — updates call records when calls complete."""
    try:
        form = await request.form()
        call_sid = str(form.get("CallSid", ""))
        call_status = str(form.get("CallStatus", ""))
        call_duration = str(form.get("CallDuration", ""))
        logger.info("Twilio callback: SID=%s Status=%s Duration=%s", call_sid, call_status, call_duration)

        terminal_statuses = {"completed", "failed", "busy", "no-answer", "canceled"}
        if call_status in terminal_statuses:
            _active_call_participants.pop(call_sid, None)
            try:
                async with AsyncSessionLocal() as db_session:
                    calls = await db_session.execute(
                        select(Call)
                        .where(Call.status == "In Progress")
                        .order_by(Call.started_at.desc())
                        .limit(1)
                    )
                    call_row = calls.scalar_one_or_none()
                    if call_row:
                        call_row.status = "Completed" if call_status == "completed" else "Failed"
                        if call_duration:
                            call_row.duration_seconds = int(call_duration)
                        call_row.ended_at = datetime.utcnow()
                        await db_session.commit()
            except Exception as db_err:
                logger.warning("Could not update call record: %s", db_err)

    except Exception as e:
        logger.warning("Error parsing status callback: %s", e)

    return {"status": "received"}


# ─── Legacy / inbound TwiML endpoints (kept for backward compat) ─────────────

@router.post("/twiml/outbound")
@router.get("/twiml/outbound")
async def twiml_outbound():
    """Legacy outbound TwiML — kept for backward compatibility."""
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        '    <Say voice="Polly.Joanna-Neural">'
        "Hello! This is Alex from VoxSales AI. Our AI assistant will be with you shortly."
        "</Say>\n"
        '    <Pause length="1"/>\n'
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@router.post("/twiml/inbound")
@router.get("/twiml/inbound")
async def twiml_inbound():
    """
    Handles inbound calls to the Twilio phone number.
    Bridges into LiveKit room via SIP if configured, else plays a message.
    """
    if settings.livekit_sip_configured:
        room_name = f"voxsales-inbound-{uuid.uuid4().hex[:8]}"
        twiml = _build_sip_twiml(
            room_name=room_name,
            opening_line="Thank you for calling VoxSales AI. Connecting you now.",
        )
        return Response(content=twiml, media_type="application/xml")

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        '    <Say voice="Polly.Joanna-Neural">'
        "Thank you for calling VoxSales AI. Please hold while we connect you."
        "</Say>\n"
        '    <Pause length="1"/>\n'
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@router.post("/twiml/sip-bridge")
@router.get("/twiml/sip-bridge")
async def twiml_sip_bridge(room_name: Optional[str] = None):
    """Kept for backward compatibility."""
    if room_name and settings.livekit_sip_configured:
        twiml = _build_sip_twiml(room_name=room_name)
        return Response(content=twiml, media_type="application/xml")

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        '    <Say voice="Polly.Joanna-Neural">Connecting you to our AI sales assistant.</Say>\n'
        '    <Pause length="1"/>\n'
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


# ── Playground voice session ─────────────────────────────────────────────────

class PlaygroundSessionRequest(BaseModel):
    agent_id: Optional[str] = None


@router.post("/playground-session")
async def create_playground_session(
    body: PlaygroundSessionRequest,
    ctx: AuthContext = Depends(get_current_user),
):
    """
    Creates a LiveKit room, dispatches the AI voice agent into it, and returns
    a browser-side access token so the frontend can connect via WebRTC and talk
    directly to the AI agent — no phone call needed.
    """
    if not settings.livekit_configured:
        raise HTTPException(status_code=503, detail="LiveKit is not configured.")

    from livekit.api import LiveKitAPI, AccessToken, VideoGrants, CreateRoomRequest, CreateAgentDispatchRequest
    import time as _time

    room_name = f"playground-{uuid.uuid4().hex[:12]}"

    # Load agent config
    agent_config = {
        "workspace_id": str(ctx.workspace_id),
        "agent_id": str(body.agent_id) if body.agent_id else "",
        "lead_id": "",
        "call_id": str(uuid.uuid4()),
        "company_name": "VoxSales AI",
        "agent_name": "Alex",
        "objective": "Introduce VoxSales AI and demonstrate how it can automate sales calls. Be warm and conversational.",
        "opening_script": "Hey there! I'm Alex from VoxSales AI. This is our live voice playground — you can talk to me just like a real call!",
        "tone": "Warm, confident, conversational",
        "lead_name": "Prospect",
        "lead_company": "",
        "lead_title": "",
        "llm_provider": "mistral",
        "mistral_model": settings.mistral_model,
        "tts_voice": "nova",
        "mode": "playground",
    }

    # Optionally load agent details from DB
    if body.agent_id:
        try:
            import uuid as _uuid
            agent_uuid = _uuid.UUID(body.agent_id)
            async with AsyncSessionLocal() as db_session:
                from app.models.agent import Agent
                res = await db_session.execute(select(Agent).where(Agent.id == agent_uuid))
                agent = res.scalar_one_or_none()
                if agent:
                    agent_config["agent_name"] = agent.name or "Alex"
                    agent_config["objective"] = getattr(agent, "objective", "") or agent_config["objective"]
                    agent_config["opening_script"] = getattr(agent, "opening_script", "") or agent_config["opening_script"]
                    agent_config["tone"] = getattr(agent, "tone", "") or agent_config["tone"]
        except Exception as e:
            logger.warning("Could not load agent: %s", e)

    import json as _json
    meta = _json.dumps(agent_config)

    try:
        async with LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        ) as lk:
            # Create room
            await lk.room.create_room(CreateRoomRequest(
                name=room_name,
                metadata=meta,
                empty_timeout=300,
            ))

            # Dispatch agent
            try:
                await lk.agent_dispatch.create_dispatch(CreateAgentDispatchRequest(
                    agent_name="voxsales-agent",
                    room=room_name,
                    metadata=meta,
                ))
                logger.info("Agent dispatched to playground room: %s", room_name)
            except Exception as e:
                logger.warning("Could not dispatch agent: %s", e)

            # Generate browser access token
            participant_name = f"user-{uuid.uuid4().hex[:6]}"
            token = (
                AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
                .with_identity(participant_name)
                .with_name("You")
                .with_grants(VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                ))
                .to_jwt()
            )

        return {
            "token": token,
            "ws_url": settings.livekit_url,
            "room": room_name,
        }

    except Exception as e:
        logger.exception("Failed to create playground session: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")
