"""
Indianvoice.ai — Exotel India Telephony Integration
Handles outbound calling via Exotel for Indian PSTN numbers (+91).

Exotel is India's leading cloud telephony platform with:
- Direct Jio/Airtel/BSNL/Vi routing
- Indian caller IDs (+91...)
- ₹0.25–0.50/min rates (vs Twilio ₹4+/min)
- TRAI compliance support

Exotel API Docs: https://developer.exotel.com/api/
"""
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

EXOTEL_BASE_URL = "https://api.exotel.com/v1/Accounts"


class ExotelClient:
    """
    Exotel REST API client for outbound calling.
    Bridges Exotel call with LiveKit room via SIP/WebRTC stream.
    """

    def __init__(
        self,
        sid: Optional[str] = None,
        api_key: Optional[str] = None,
        api_token: Optional[str] = None,
        subdomain: Optional[str] = None,
    ):
        self.sid = sid or os.getenv("EXOTEL_SID", "")
        self.api_key = api_key or os.getenv("EXOTEL_API_KEY", "")
        self.api_token = api_token or os.getenv("EXOTEL_API_TOKEN", "")
        self.subdomain = subdomain or os.getenv("EXOTEL_SUBDOMAIN", "api.exotel.com")
        self.from_number = os.getenv("EXOTEL_CALLER_ID", "")

        if not all([self.sid, self.api_key, self.api_token]):
            logger.warning(
                "Exotel credentials not fully configured. "
                "Set EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN."
            )

        self.base_url = f"https://{self.api_key}:{self.api_token}@{self.subdomain}/v1/Accounts/{self.sid}"
        self._client = httpx.AsyncClient(timeout=30.0)

    async def make_call(
        self,
        to_number: str,
        caller_id: str,
        status_callback_url: str,
        custom_field: Optional[str] = None,
    ) -> dict:
        """
        Initiate an outbound call via Exotel.
        
        Args:
            to_number: Destination phone number (+91XXXXXXXXXX)
            caller_id: Exotel verified caller ID to show to recipient
            status_callback_url: URL to receive call status webhooks
            custom_field: Optional metadata to pass through
            
        Returns:
            Exotel API response dict with CallSid, Status, etc.
        """
        # Normalize Indian number format
        to_number = _normalize_indian_number(to_number)
        caller_id = _normalize_indian_number(caller_id) if caller_id else self.from_number

        url = f"{self.base_url}/Calls/connect.json"
        payload = {
            "From": caller_id,
            "To": to_number,
            "CallType": "trans",                    # trans = transactional call
            "StatusCallback": status_callback_url,
            "StatusCallbackEvents[0]": "terminal",  # Get webhook when call ends
            "StatusCallbackContentType": "application/json",
        }
        if custom_field:
            payload["CustomField"] = custom_field

        try:
            response = await self._client.post(url, data=payload)
            response.raise_for_status()
            result = response.json()
            call_data = result.get("Call", {})
            logger.info(
                "Exotel call initiated: sid=%s to=%s status=%s",
                call_data.get("Sid"),
                to_number,
                call_data.get("Status"),
            )
            return call_data
        except httpx.HTTPStatusError as e:
            logger.error(
                "Exotel API error: %s — %s",
                e.response.status_code,
                e.response.text,
            )
            raise
        except Exception as e:
            logger.error("Exotel call failed: %s", e)
            raise

    async def get_call_status(self, call_sid: str) -> dict:
        """Fetch the current status of a call."""
        url = f"{self.base_url}/Calls/{call_sid}.json"
        try:
            response = await self._client.get(url)
            response.raise_for_status()
            return response.json().get("Call", {})
        except Exception as e:
            logger.error("Exotel get_call_status failed for %s: %s", call_sid, e)
            return {}

    async def end_call(self, call_sid: str) -> bool:
        """Terminate an active call."""
        url = f"{self.base_url}/Calls/{call_sid}.json"
        try:
            response = await self._client.post(url, data={"Status": "completed"})
            response.raise_for_status()
            logger.info("Exotel call ended: %s", call_sid)
            return True
        except Exception as e:
            logger.error("Exotel end_call failed for %s: %s", call_sid, e)
            return False

    async def make_livekit_bridged_call(
        self,
        to_number: str,
        caller_id: str,
        livekit_connect_url: str,
        status_callback_url: str,
        custom_field: Optional[str] = None,
    ) -> dict:
        """
        Make an Exotel call that streams audio to a LiveKit room via WebSocket.
        
        Exotel → WebSocket stream → LiveKit room → AI Agent
        
        Args:
            to_number: Destination number
            caller_id: Exotel caller ID
            livekit_connect_url: LiveKit WebSocket stream URL for audio bridging
            status_callback_url: Webhook for call status updates
            custom_field: Optional metadata
        """
        to_number = _normalize_indian_number(to_number)
        caller_id = _normalize_indian_number(caller_id) if caller_id else self.from_number

        # Exotel supports WebSocket audio streaming via "stream" call type
        # This bridges Exotel PSTN audio into LiveKit
        url = f"{self.base_url}/Calls/connect.json"
        payload = {
            "From": caller_id,
            "To": to_number,
            "CallType": "trans",
            "StatusCallback": status_callback_url,
            "StatusCallbackEvents[0]": "terminal",
            "StatusCallbackContentType": "application/json",
            # Stream audio to LiveKit via exotel passthru URL
            "Url": livekit_connect_url,
        }
        if custom_field:
            payload["CustomField"] = custom_field

        try:
            response = await self._client.post(url, data=payload)
            response.raise_for_status()
            result = response.json()
            call_data = result.get("Call", {})
            logger.info(
                "Exotel→LiveKit bridged call initiated: sid=%s to=%s status=%s",
                call_data.get("Sid"),
                to_number,
                call_data.get("Status"),
            )
            return call_data
        except httpx.HTTPStatusError as e:
            logger.error("Exotel LiveKit bridge error: %s — %s", e.response.status_code, e.response.text)
            raise

    async def close(self):
        await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()


def _normalize_indian_number(number: str) -> str:
    """
    Normalize an Indian phone number to E.164 format (+91XXXXXXXXXX).
    Handles:
      - 10-digit: 9876543210 → +919876543210
      - With 0: 09876543210 → +919876543210
      - With 91: 919876543210 → +919876543210
      - Already E.164: +919876543210 → +919876543210
    """
    # Strip whitespace and common characters
    number = number.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

    if number.startswith("+91"):
        return number  # Already E.164
    if number.startswith("91") and len(number) == 12:
        return "+" + number
    if number.startswith("0") and len(number) == 11:
        return "+91" + number[1:]
    if len(number) == 10:
        return "+91" + number

    # Return as-is for international numbers or already formatted
    return number if number.startswith("+") else "+" + number


def is_indian_number(phone: str) -> bool:
    """Check if a phone number is an Indian (+91) number."""
    normalized = _normalize_indian_number(phone)
    return normalized.startswith("+91") and len(normalized) == 13


# ─── Singleton factory ────────────────────────────────────────────────────────

_exotel_client: Optional[ExotelClient] = None


def get_exotel_client() -> ExotelClient:
    """Get or create the global Exotel client."""
    global _exotel_client
    if _exotel_client is None:
        _exotel_client = ExotelClient()
    return _exotel_client
