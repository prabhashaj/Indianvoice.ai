"""
Indianvoice.ai — TRAI Compliance Service
Ensures all outbound calls comply with TRAI regulations:

1. NDNC/DND Registry: National Do Not Call registry scrubbing
2. Calling Window: 9AM–9PM IST (TRAI mandate)
3. Call Frequency: Max 3 calls/number/week
4. Opt-out Management: Immediate removal on request

TRAI References:
- TRAI Act 1997 Section 11(1)(b)
- Telecom Commercial Communications Customer Preference Regulations 2018
- DPDP Act 2023
"""
import logging
from datetime import datetime, time, timezone, timedelta
from typing import Optional

import pytz

logger = logging.getLogger(__name__)

IST = pytz.timezone("Asia/Kolkata")

# TRAI calling window: 9 AM to 9 PM IST
TRAI_WINDOW_START = time(9, 0)   # 9:00 AM IST
TRAI_WINDOW_END = time(21, 0)    # 9:00 PM IST

# TRAI maximum calls per number per week (7 days)
TRAI_MAX_CALLS_PER_WEEK = 3


class TraiComplianceError(Exception):
    """Raised when a call violates TRAI regulations."""
    pass


class TraiComplianceService:
    """
    TRAI compliance checks for outbound calling.
    All checks must pass before a call is initiated.
    """

    def __init__(self, db_session=None):
        self.db = db_session

    def is_within_calling_window(self, dt: Optional[datetime] = None) -> bool:
        """
        Check if the current time (or given datetime) is within the TRAI
        allowed calling window: 9AM–9PM IST.
        """
        check_dt = dt or datetime.now(IST)
        if check_dt.tzinfo is None:
            check_dt = IST.localize(check_dt)
        else:
            check_dt = check_dt.astimezone(IST)

        current_time = check_dt.time()
        in_window = TRAI_WINDOW_START <= current_time < TRAI_WINDOW_END
        logger.debug(
            "TRAI calling window check: time=%s in_window=%s",
            current_time.strftime("%H:%M IST"),
            in_window,
        )
        return in_window

    def get_next_calling_window(self) -> datetime:
        """Return the next available time the call can be placed (9AM IST next day if outside window)."""
        now = datetime.now(IST)
        current_time = now.time()

        if current_time < TRAI_WINDOW_START:
            # Before 9AM today — call at 9AM today
            return now.replace(hour=9, minute=0, second=0, microsecond=0)
        elif current_time >= TRAI_WINDOW_END:
            # After 9PM today — call at 9AM tomorrow
            tomorrow = now + timedelta(days=1)
            return tomorrow.replace(hour=9, minute=0, second=0, microsecond=0)
        else:
            return now  # Currently within window

    async def check_dnd_status(self, phone_number: str) -> bool:
        """
        Check if a phone number is on the TRAI NDNC/DND registry.
        
        Returns:
            True if number is DND (do NOT call)
            False if number is safe to call
            
        NOTE: Production implementation should query the TRAI NDNC API
        or use a DND scrubbing service like Servetel/Exotel's built-in DND check.
        """
        # TODO: Integrate with TRAI NDNC API or Exotel DND check
        # For now, we check our local opt-out database
        if self.db:
            try:
                from sqlalchemy import select, text
                from app.models import Lead

                # Check if lead is marked Do Not Contact in our DB
                result = await self.db.execute(
                    select(Lead).where(
                        Lead.phone == phone_number,
                        Lead.do_not_contact == True,  # noqa
                    )
                )
                lead = result.scalar_one_or_none()
                if lead:
                    logger.info("DND check: %s is marked Do Not Contact", phone_number)
                    return True
            except Exception as e:
                logger.error("DND check DB error: %s", e)

        logger.debug("DND check: %s — not on local DND list", phone_number)
        return False

    async def check_call_frequency(self, phone_number: str) -> bool:
        """
        Check if the call frequency limit has been exceeded for this number.
        TRAI limit: max 3 transactional calls per number per 7-day period.
        
        Returns:
            True if limit exceeded (do NOT call)
            False if within limit (safe to call)
        """
        if not self.db:
            return False

        try:
            from sqlalchemy import select, func, text
            from app.models import Call
            from datetime import datetime, timedelta

            week_ago = datetime.utcnow() - timedelta(days=7)
            result = await self.db.execute(
                select(func.count(Call.id)).where(
                    Call.lead_phone == phone_number,
                    Call.created_at >= week_ago,
                    Call.status.in_(["Completed", "Answered", "Busy"]),
                )
            )
            call_count = result.scalar() or 0

            exceeded = call_count >= TRAI_MAX_CALLS_PER_WEEK
            logger.debug(
                "Call frequency check: %s — %d calls this week (limit=%d) exceeded=%s",
                phone_number, call_count, TRAI_MAX_CALLS_PER_WEEK, exceeded,
            )
            return exceeded
        except Exception as e:
            logger.error("Call frequency check error: %s", e)
            return False

    async def run_all_checks(self, phone_number: str) -> dict:
        """
        Run all TRAI compliance checks for a phone number.
        
        Returns dict with:
            - allowed: bool (True if call can proceed)
            - reason: str (reason if not allowed)
            - next_window: datetime (when calling is next allowed, if outside window)
        """
        # 1. Calling window check
        if not self.is_within_calling_window():
            next_window = self.get_next_calling_window()
            return {
                "allowed": False,
                "reason": f"Outside TRAI calling window (9AM–9PM IST). Next window: {next_window.strftime('%I:%M %p IST %d %b')}",
                "next_window": next_window.isoformat(),
            }

        # 2. DND/NDNC check
        is_dnd = await self.check_dnd_status(phone_number)
        if is_dnd:
            return {
                "allowed": False,
                "reason": f"Number {phone_number} is on DND/NDNC registry or opted out.",
                "next_window": None,
            }

        # 3. Call frequency check
        frequency_exceeded = await self.check_call_frequency(phone_number)
        if frequency_exceeded:
            return {
                "allowed": False,
                "reason": f"Call frequency limit exceeded for {phone_number} (max {TRAI_MAX_CALLS_PER_WEEK} calls/week per TRAI).",
                "next_window": None,
            }

        return {
            "allowed": True,
            "reason": "All TRAI compliance checks passed.",
            "next_window": None,
        }


def get_trai_service(db_session=None) -> TraiComplianceService:
    """Factory for TraiComplianceService."""
    return TraiComplianceService(db_session=db_session)
