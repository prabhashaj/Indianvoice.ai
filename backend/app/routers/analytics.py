"""
VoxSales AI — Analytics Router
Pre-aggregated analytics queries designed for dashboard consumption.
All queries are workspace-scoped.
"""
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.database import get_db
from app.models import Agent, Call, Campaign, Lead

router = APIRouter()


class TimeSeriesPoint(BaseModel):
    label: str
    calls: int
    connected: int
    qualified: int


class FunnelStage(BaseModel):
    stage: str
    value: int


class AgentStat(BaseModel):
    agent_id: str
    agent_name: str
    calls: int
    connected: int
    qualified: int
    meetings: int
    conversion: float


class AnalyticsSummary(BaseModel):
    total_calls: int
    total_connected: int
    total_qualified: int
    total_meetings: int
    connect_rate: float
    qualify_rate: float
    conversion_rate: float
    active_campaigns: int
    total_leads: int


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Overall workspace analytics summary."""
    call_stats = await db.execute(
        select(func.count(Call.id).label("total")).where(
            Call.workspace_id == ctx.workspace_id
        )
    )
    total_calls = call_stats.scalar() or 0

    connected_count = await db.execute(
        select(func.count(Call.id)).where(
            Call.workspace_id == ctx.workspace_id,
            Call.status == "Completed",
        )
    )
    total_connected = connected_count.scalar() or 0

    qualified_count = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == ctx.workspace_id,
            Lead.status.in_(["Qualified", "Meeting"]),
        )
    )
    total_qualified = qualified_count.scalar() or 0

    meetings_count = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == ctx.workspace_id,
            Lead.status == "Meeting",
        )
    )
    total_meetings = meetings_count.scalar() or 0

    active_campaigns = await db.execute(
        select(func.count(Campaign.id)).where(
            Campaign.workspace_id == ctx.workspace_id,
            Campaign.status == "Running",
        )
    )

    total_leads_count = await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == ctx.workspace_id)
    )

    return AnalyticsSummary(
        total_calls=total_calls,
        total_connected=total_connected,
        total_qualified=total_qualified,
        total_meetings=total_meetings,
        connect_rate=round((total_connected / total_calls * 100), 1) if total_calls else 0.0,
        qualify_rate=round((total_qualified / total_connected * 100), 1) if total_connected else 0.0,
        conversion_rate=round((total_meetings / total_calls * 100), 1) if total_calls else 0.0,
        active_campaigns=active_campaigns.scalar() or 0,
        total_leads=total_leads_count.scalar() or 0,
    )


@router.get("/timeseries", response_model=List[TimeSeriesPoint])
async def get_timeseries(
    days: int = Query(7, ge=1, le=90),
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Daily call activity for the past N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(
            func.date(Call.created_at).label("day"),
            func.count(Call.id).label("calls"),
            func.sum(
                case((Call.status == "Completed", 1), else_=0)
            ).label("connected"),
        )
        .where(Call.workspace_id == ctx.workspace_id, Call.created_at >= since)
        .group_by(func.date(Call.created_at))
        .order_by(func.date(Call.created_at))
    )
    rows = result.all()
    return [
        TimeSeriesPoint(
            label=str(row.day) if row.day else "?",
            calls=row.calls or 0,
            connected=int(row.connected or 0),
            qualified=0,
        )
        for row in rows
    ]


@router.get("/funnel", response_model=List[FunnelStage])
async def get_funnel(
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pipeline funnel from contacts to meetings."""
    total_result = await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == ctx.workspace_id)
    )
    total = total_result.scalar() or 0

    called_result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == ctx.workspace_id,
            Lead.status.in_(["Contacted", "Interested", "Qualified", "Meeting", "Not Interested"]),
        )
    )
    called = called_result.scalar() or 0

    connected_result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == ctx.workspace_id,
            Lead.status.in_(["Interested", "Qualified", "Meeting"]),
        )
    )
    connected = connected_result.scalar() or 0

    qualified_result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == ctx.workspace_id,
            Lead.status.in_(["Qualified", "Meeting"]),
        )
    )
    qualified = qualified_result.scalar() or 0

    meeting_result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == ctx.workspace_id,
            Lead.status == "Meeting",
        )
    )
    meeting = meeting_result.scalar() or 0

    return [
        FunnelStage(stage="Contacts", value=total),
        FunnelStage(stage="Called", value=called),
        FunnelStage(stage="Connected", value=connected),
        FunnelStage(stage="Interested", value=connected),
        FunnelStage(stage="Qualified", value=qualified),
        FunnelStage(stage="Meeting", value=meeting),
    ]


@router.get("/agents", response_model=List[AgentStat])
async def get_agent_stats(
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-agent performance metrics."""
    agents_result = await db.execute(
        select(Agent).where(Agent.workspace_id == ctx.workspace_id)
    )
    agents = agents_result.scalars().all()

    stats = []
    for agent in agents:
        call_count = await db.execute(
            select(func.count(Call.id)).where(
                Call.workspace_id == ctx.workspace_id,
                Call.agent_id == agent.id,
            )
        )
        total = call_count.scalar() or 0

        connected_q = await db.execute(
            select(func.count(Call.id)).where(
                Call.workspace_id == ctx.workspace_id,
                Call.agent_id == agent.id,
                Call.status == "Completed",
            )
        )
        total_connected = connected_q.scalar() or 0
        conversion = round((total_connected / total * 100), 1) if total > 0 else agent.conversion_rate

        stats.append(
            AgentStat(
                agent_id=str(agent.id),
                agent_name=agent.name,
                calls=total,
                connected=total_connected,
                qualified=0,
                meetings=0,
                conversion=conversion,
            )
        )

    return sorted(stats, key=lambda x: x.conversion, reverse=True)
