"""
VoxSales AI — Follow-ups Router
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.database import get_db
from app.models import FollowUp

router = APIRouter()


class FollowUpCreate(BaseModel):
    lead_id: Optional[str] = None
    call_id: Optional[str] = None
    reason: str
    action: str
    priority: str = "Medium"
    due_at: Optional[datetime] = None


class FollowUpResponse(BaseModel):
    id: str
    workspace_id: str
    lead_id: Optional[str]
    call_id: Optional[str]
    reason: str
    action: str
    priority: str
    status: str
    due_at: Optional[datetime]
    completed_at: Optional[datetime]

    @classmethod
    def from_orm(cls, f: FollowUp) -> "FollowUpResponse":
        return cls(
            id=str(f.id),
            workspace_id=str(f.workspace_id),
            lead_id=str(f.lead_id) if f.lead_id else None,
            call_id=str(f.call_id) if f.call_id else None,
            reason=f.reason,
            action=f.action,
            priority=f.priority,
            status=f.status,
            due_at=f.due_at,
            completed_at=f.completed_at,
        )


@router.get("", response_model=List[FollowUpResponse])
async def list_follow_ups(
    status: Optional[str] = None,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FollowUp).where(FollowUp.workspace_id == ctx.workspace_id)
    if status:
        stmt = stmt.where(FollowUp.status == status)
    stmt = stmt.order_by(FollowUp.due_at.asc().nullslast())
    result = await db.execute(stmt)
    return [FollowUpResponse.from_orm(f) for f in result.scalars().all()]


@router.post("", response_model=FollowUpResponse, status_code=201)
async def create_follow_up(
    body: FollowUpCreate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fu = FollowUp(
        workspace_id=ctx.workspace_id,
        lead_id=uuid.UUID(body.lead_id) if body.lead_id else None,
        call_id=uuid.UUID(body.call_id) if body.call_id else None,
        reason=body.reason,
        action=body.action,
        priority=body.priority,
        due_at=body.due_at,
    )
    db.add(fu)
    await db.commit()
    await db.refresh(fu)
    return FollowUpResponse.from_orm(fu)


@router.patch("/{follow_up_id}/complete", response_model=FollowUpResponse)
async def complete_follow_up(
    follow_up_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FollowUp).where(
            FollowUp.id == uuid.UUID(follow_up_id),
            FollowUp.workspace_id == ctx.workspace_id,
        )
    )
    fu = result.scalar_one_or_none()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    fu.status = "Completed"
    fu.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(fu)
    return FollowUpResponse.from_orm(fu)


@router.patch("/{follow_up_id}/reschedule")
async def reschedule_follow_up(
    follow_up_id: str,
    due_at: datetime,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FollowUp).where(
            FollowUp.id == uuid.UUID(follow_up_id),
            FollowUp.workspace_id == ctx.workspace_id,
        )
    )
    fu = result.scalar_one_or_none()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    fu.due_at = due_at
    await db.commit()
    return {"id": follow_up_id, "due_at": str(due_at)}
