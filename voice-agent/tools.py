"""
Indianvoice.ai — Agent Tools
Tools that the AI agent can invoke during a call to interact with the backend API.
All tools post to the VoxSales backend via authenticated HTTP.
"""
import asyncio
import logging
import os
from typing import Optional

import httpx

from config import VoiceAgentConfig

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "")  # Internal service-to-service key


class AgentTools:
    """
    Tool implementations callable by the sales agent during a voice session.
    Each method communicates with the VoxSales backend API.
    """

    def __init__(self, config: VoiceAgentConfig):
        self.config = config
        self._client = httpx.AsyncClient(
            base_url=BACKEND_URL,
            headers={"Authorization": f"Bearer {AGENT_API_KEY}"},
            timeout=10.0,
        )

    async def _post(self, path: str, data: dict) -> Optional[dict]:
        try:
            r = await self._client.post(path, json=data)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error("Tool call failed [POST %s]: %s", path, e)
            return None

    async def _patch(self, path: str, data: dict) -> Optional[dict]:
        try:
            r = await self._client.patch(path, json=data)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error("Tool call failed [PATCH %s]: %s", path, e)
            return None

    # ── Lead tools ─────────────────────────────────────────────────────────────

    async def update_lead_score(self, intent_score: int, sentiment: str):
        """Update the lead's intent score and sentiment after analysis."""
        if not self.config.lead_id:
            return
        await self._patch(
            f"/leads/{self.config.lead_id}",
            {"intent_score": intent_score, "sentiment": sentiment},
        )
        logger.info("[%s] Lead score updated: intent=%d sentiment=%s",
                    self.config.call_id, intent_score, sentiment)

    async def add_lead_pain_point(self, pain_point: str):
        """Record a discovered pain point for the lead."""
        if not self.config.lead_id:
            return
        # Fetch current pain points and append
        try:
            r = await self._client.get(f"/leads/{self.config.lead_id}")
            if r.status_code == 200:
                current = r.json().get("pain_points", [])
                if pain_point not in current:
                    current.append(pain_point)
                    await self._patch(
                        f"/leads/{self.config.lead_id}",
                        {"pain_points": current},
                    )
        except Exception as e:
            logger.error("add_lead_pain_point failed: %s", e)

    async def record_objection(self, objection: str):
        """Record an objection raised during the call."""
        if not self.config.lead_id:
            return
        try:
            r = await self._client.get(f"/leads/{self.config.lead_id}")
            if r.status_code == 200:
                current = r.json().get("objections", [])
                if objection not in current:
                    current.append(objection)
                    await self._patch(
                        f"/leads/{self.config.lead_id}",
                        {"objections": current},
                    )
        except Exception as e:
            logger.error("record_objection failed: %s", e)

    async def update_lead_status(self, status: str):
        """Update the lead's CRM status."""
        if not self.config.lead_id:
            return
        await self._patch(f"/leads/{self.config.lead_id}", {"status": status})
        logger.info("[%s] Lead status → %s", self.config.call_id, status)

    async def mark_do_not_contact(self, reason: str = "Requested on call"):
        """Mark lead as Do Not Contact — immediate compliance action."""
        if not self.config.lead_id:
            return
        await self._patch(
            f"/leads/{self.config.lead_id}",
            {"do_not_contact": True, "status": "Do Not Contact", "notes": reason},
        )
        logger.info("[%s] Lead marked Do Not Contact", self.config.call_id)

    # ── Meeting tools ──────────────────────────────────────────────────────────

    async def schedule_meeting(
        self,
        title: str,
        description: str = "",
        duration_minutes: int = 30,
    ) -> Optional[dict]:
        """Book a meeting and return the created meeting record."""
        if not self.config.lead_id:
            return None
        result = await self._post(
            "/meetings",
            {
                "workspace_id": self.config.workspace_id,
                "lead_id": self.config.lead_id,
                "call_id": self.config.call_id,
                "title": title,
                "description": description,
                "duration_minutes": duration_minutes,
                "status": "Scheduled",
            },
        )
        logger.info("[%s] Meeting scheduled: %s", self.config.call_id, title)
        return result

    # ── Follow-up tools ────────────────────────────────────────────────────────

    async def create_follow_up(self, reason: str, action: str, priority: str = "High"):
        """Create a follow-up task for the human sales team."""
        await self._post(
            "/follow-ups",
            {
                "workspace_id": self.config.workspace_id,
                "lead_id": self.config.lead_id,
                "call_id": self.config.call_id,
                "reason": reason,
                "action": action,
                "priority": priority,
            },
        )
        logger.info("[%s] Follow-up created: %s", self.config.call_id, action)

    # ── Call lifecycle tools ───────────────────────────────────────────────────

    async def add_transcript_line(
        self, speaker: str, text: str, offset_seconds: float, is_highlight: bool = False
    ):
        """Append a transcript line to the call record."""
        if not self.config.call_id:
            return
        await self._post(
            f"/calls/{self.config.call_id}/transcript",
            {
                "speaker": speaker,
                "text": text,
                "offset_seconds": offset_seconds,
                "is_highlight": is_highlight,
            },
        )

    async def finalize_call(self, outcome: str, intent_score: int = 0):
        """
        Called at the end of every call to update the call record with
        the final outcome, analysis, and lead score.
        """
        if not self.config.call_id:
            return
        await self._patch(
            f"/calls/{self.config.call_id}",
            {
                "status": "Completed",
                "outcome": outcome,
                "intent_score": intent_score,
            },
        )
        # Also update lead's last contact time and status
        if outcome in ("Meeting booked", "Qualified"):
            await self.update_lead_status(
                "Meeting" if outcome == "Meeting booked" else "Qualified"
            )
        logger.info("[%s] Call finalized: outcome=%s intent=%d",
                    self.config.call_id, outcome, intent_score)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self._client.aclose()
