"""
VoxSales AI — Agents Router
Full CRUD for AI agents with workspace isolation.
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.database import get_db
from app.models import Agent

router = APIRouter()


class AgentCreate(BaseModel):
    name: str
    description: str = ""
    voice: str = ""
    languages: List[str] = ["English"]
    industry: str = ""
    objective: str = ""
    tone: str = ""
    opening_script: str = ""
    qualification_criteria: str = ""
    objection_playbook: dict = {}
    business_info: dict = {}


class AgentUpdate(AgentCreate):
    status: Optional[str] = None


class AgentResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str
    status: str
    voice: str
    languages: List[str]
    industry: str
    objective: str
    tone: str
    opening_script: str
    qualification_criteria: str
    objection_playbook: dict
    business_info: dict
    total_calls: int
    conversion_rate: float

    @classmethod
    def from_orm(cls, agent: Agent) -> "AgentResponse":
        return cls(
            id=str(agent.id),
            workspace_id=str(agent.workspace_id),
            name=agent.name,
            description=agent.description,
            status=agent.status,
            voice=agent.voice,
            languages=agent.languages or [],
            industry=agent.industry,
            objective=agent.objective,
            tone=agent.tone,
            opening_script=agent.opening_script,
            qualification_criteria=agent.qualification_criteria,
            objection_playbook=agent.objection_playbook or {},
            business_info=agent.business_info or {},
            total_calls=agent.total_calls,
            conversion_rate=agent.conversion_rate,
        )


def workspace_filter(stmt, ctx: AuthContext):
    return stmt.where(Agent.workspace_id == ctx.workspace_id)


@router.get("", response_model=List[AgentResponse])
async def list_agents(
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.workspace_id == ctx.workspace_id).order_by(Agent.created_at.desc())
    )
    return [AgentResponse.from_orm(a) for a in result.scalars().all()]


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    body: AgentCreate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = Agent(workspace_id=ctx.workspace_id, **body.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return AgentResponse.from_orm(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.workspace_id == ctx.workspace_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentResponse.from_orm(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    body: AgentUpdate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.workspace_id == ctx.workspace_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return AgentResponse.from_orm(agent)


@router.patch("/{agent_id}/status")
async def set_status(
    agent_id: str,
    status: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.workspace_id == ctx.workspace_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if status not in ("Active", "Paused", "Draft"):
        raise HTTPException(status_code=400, detail="Invalid status")
    agent.status = status
    await db.commit()
    return {"id": agent_id, "status": status}


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.workspace_id == ctx.workspace_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await db.delete(agent)
    await db.commit()
