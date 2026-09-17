"""
VoxSales AI — Campaigns Router
Full CRUD + launch/pause/complete lifecycle with workspace isolation.
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.database import get_db
from app.models import Campaign

router = APIRouter()


class ScheduleModel(BaseModel):
    days: List[str] = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    start: str = "09:00"
    end: str = "17:00"
    timezone: str = "UTC"


class CampaignCreate(BaseModel):
    name: str
    audience: str = ""
    objective: str = ""
    agent_id: Optional[str] = None
    schedule: ScheduleModel = ScheduleModel()
    status: str = "Draft"


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    audience: Optional[str] = None
    objective: Optional[str] = None
    agent_id: Optional[str] = None
    schedule: Optional[ScheduleModel] = None


class CampaignResponse(BaseModel):
    id: str
    workspace_id: str
    agent_id: Optional[str]
    name: str
    audience: str
    objective: str
    status: str
    schedule: ScheduleModel
    total_leads: int
    completed: int
    connected: int
    interested: int
    qualified: int
    meetings: int
    total_calls: int

    @classmethod
    def from_orm(cls, c: Campaign) -> "CampaignResponse":
        return cls(
            id=str(c.id),
            workspace_id=str(c.workspace_id),
            agent_id=str(c.agent_id) if c.agent_id else None,
            name=c.name,
            audience=c.audience,
            objective=c.objective,
            status=c.status,
            schedule=ScheduleModel(
                days=c.schedule_days or [],
                start=c.schedule_start,
                end=c.schedule_end,
                timezone=c.schedule_timezone,
            ),
            total_leads=c.total_leads,
            completed=c.completed,
            connected=c.connected,
            interested=c.interested,
            qualified=c.qualified,
            meetings=c.meetings,
            total_calls=c.total_calls,
        )


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Campaign)
        .where(Campaign.workspace_id == ctx.workspace_id)
        .order_by(Campaign.created_at.desc())
    )
    return [CampaignResponse.from_orm(c) for c in result.scalars().all()]


@router.post("", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    body: CampaignCreate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    campaign = Campaign(
        workspace_id=ctx.workspace_id,
        agent_id=uuid.UUID(body.agent_id) if body.agent_id else None,
        name=body.name,
        audience=body.audience,
        objective=body.objective,
        status=body.status,
        schedule_days=body.schedule.days,
        schedule_start=body.schedule.start,
        schedule_end=body.schedule.end,
        schedule_timezone=body.schedule.timezone,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return CampaignResponse.from_orm(campaign)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid.UUID(campaign_id),
            Campaign.workspace_id == ctx.workspace_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignResponse.from_orm(campaign)


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    body: CampaignUpdate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid.UUID(campaign_id),
            Campaign.workspace_id == ctx.workspace_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if body.name is not None:
        campaign.name = body.name
    if body.audience is not None:
        campaign.audience = body.audience
    if body.objective is not None:
        campaign.objective = body.objective
    if body.agent_id is not None:
        campaign.agent_id = uuid.UUID(body.agent_id)
    if body.schedule is not None:
        campaign.schedule_days = body.schedule.days
        campaign.schedule_start = body.schedule.start
        campaign.schedule_end = body.schedule.end
        campaign.schedule_timezone = body.schedule.timezone

    await db.commit()
    await db.refresh(campaign)
    return CampaignResponse.from_orm(campaign)


@router.patch("/{campaign_id}/status")
async def set_status(
    campaign_id: str,
    status: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    valid = {"Draft", "Scheduled", "Running", "Paused", "Completed", "Failed"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid.UUID(campaign_id),
            Campaign.workspace_id == ctx.workspace_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = status
    await db.commit()
    return {"id": campaign_id, "status": status}


@router.post("/{campaign_id}/launch")
async def launch_campaign(
    campaign_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Launch a Draft or Paused campaign — transitions to Running."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid.UUID(campaign_id),
            Campaign.workspace_id == ctx.workspace_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status not in ("Draft", "Paused", "Scheduled"):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot launch a campaign with status '{campaign.status}'",
        )
    campaign.status = "Running"
    await db.commit()
    # TODO: dispatch campaign worker via ARQ
    return {"id": campaign_id, "status": "Running", "message": "Campaign launched"}


@router.delete("/{campaign_id}", status_code=204)
async def delete_campaign(
    campaign_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == uuid.UUID(campaign_id),
            Campaign.workspace_id == ctx.workspace_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await db.delete(campaign)
    await db.commit()
