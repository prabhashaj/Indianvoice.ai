"""
VoxSales AI — SQLAlchemy Models
All database models for the complete platform.
Every resource is workspace-scoped.
"""
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


def now_utc() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ─── Users & Workspaces ───────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = uuid_pk()
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    memberships: Mapped[List["WorkspaceMember"]] = relationship(back_populates="user")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan: Mapped[str] = mapped_column(String(50), default="Starter", nullable=False)
    call_minutes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    call_minutes_limit: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    members: Mapped[List["WorkspaceMember"]] = relationship(back_populates="workspace")
    agents: Mapped[List["Agent"]] = relationship(back_populates="workspace")
    campaigns: Mapped[List["Campaign"]] = relationship(back_populates="workspace")
    leads: Mapped[List["Lead"]] = relationship(back_populates="workspace")
    calls: Mapped[List["Call"]] = relationship(back_populates="workspace")
    follow_ups: Mapped[List["FollowUp"]] = relationship(back_populates="workspace")
    meetings: Mapped[List["Meeting"]] = relationship(back_populates="workspace")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="workspace")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name="uq_workspace_members"),)

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), default="member", nullable=False)
    # roles: owner, admin, member, viewer
    created_at: Mapped[datetime] = now_utc()

    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")


# ─── AI Agents ────────────────────────────────────────────────────────────────

class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("Active", "Paused", "Draft", name="agent_status"), default="Draft", nullable=False
    )
    voice: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    languages: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    industry: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    objective: Mapped[str] = mapped_column(Text, default="", nullable=False)
    tone: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    opening_script: Mapped[str] = mapped_column(Text, default="", nullable=False)
    qualification_criteria: Mapped[str] = mapped_column(Text, default="", nullable=False)
    objection_playbook: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    business_info: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    # Stats (denormalized for fast display)
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="agents")
    campaigns: Mapped[List["Campaign"]] = relationship(back_populates="agent")
    calls: Mapped[List["Call"]] = relationship(back_populates="agent")


# ─── Campaigns ────────────────────────────────────────────────────────────────

class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    audience: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    objective: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("Draft", "Scheduled", "Running", "Paused", "Completed", "Failed", name="campaign_status"),
        default="Draft", nullable=False, index=True
    )
    # Schedule config (stored as JSON)
    schedule_days: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    schedule_start: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    schedule_end: Mapped[str] = mapped_column(String(5), default="17:00", nullable=False)
    schedule_timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)
    # Counters (denormalized)
    total_leads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    connected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    interested: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    qualified: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    meetings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="campaigns")
    agent: Mapped[Optional["Agent"]] = relationship(back_populates="campaigns")
    leads: Mapped[List["Lead"]] = relationship(back_populates="campaign")
    calls: Mapped[List["Call"]] = relationship(back_populates="campaign")


# ─── Leads ────────────────────────────────────────────────────────────────────

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    # Contact info
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    company: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    title: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    phone: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    email: Mapped[str] = mapped_column(String(320), default="", nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    industry: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    # Status
    status: Mapped[str] = mapped_column(
        Enum("New", "Contacted", "Interested", "Qualified", "Meeting",
             "Not Interested", "Do Not Contact", name="lead_status"),
        default="New", nullable=False, index=True
    )
    do_not_contact: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # AI scoring
    intent_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lead_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(20), default="Neutral", nullable=False)
    # Analysis
    pain_points: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    objections: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    next_action: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    owner: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    last_contacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="leads")
    campaign: Mapped[Optional["Campaign"]] = relationship(back_populates="leads")
    calls: Mapped[List["Call"]] = relationship(back_populates="lead")
    follow_ups: Mapped[List["FollowUp"]] = relationship(back_populates="lead")
    meetings: Mapped[List["Meeting"]] = relationship(back_populates="lead")


# ─── Calls ────────────────────────────────────────────────────────────────────

class Call(Base):
    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    # LiveKit
    livekit_room_name: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    livekit_room_id: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    # Status
    status: Mapped[str] = mapped_column(
        Enum("Pending", "In Progress", "Completed", "Failed", "Cancelled", name="call_status"),
        default="Pending", nullable=False, index=True
    )
    outcome: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # AI analysis
    sentiment: Mapped[str] = mapped_column(String(20), default="Neutral", nullable=False)
    intent_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lead_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    analysis: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    topics: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    objections: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    next_action: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    # Retry tracking
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="calls")
    campaign: Mapped[Optional["Campaign"]] = relationship(back_populates="calls")
    agent: Mapped[Optional["Agent"]] = relationship(back_populates="calls")
    lead: Mapped[Optional["Lead"]] = relationship(back_populates="calls")
    transcript_lines: Mapped[List["CallTranscriptLine"]] = relationship(back_populates="call", order_by="CallTranscriptLine.offset_seconds")


class CallTranscriptLine(Base):
    __tablename__ = "call_transcript_lines"

    id: Mapped[uuid.UUID] = uuid_pk()
    call_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker: Mapped[str] = mapped_column(Enum("AI", "Customer", name="speaker_type"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    offset_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_highlight: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = now_utc()

    call: Mapped["Call"] = relationship(back_populates="transcript_lines")


# ─── Follow-ups ───────────────────────────────────────────────────────────────

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("calls.id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    action: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(
        Enum("High", "Medium", "Low", name="priority_level"), default="Medium", nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("Pending", "Completed", "Cancelled", name="followup_status"),
        default="Pending", nullable=False, index=True
    )
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="follow_ups")
    lead: Mapped[Optional["Lead"]] = relationship(back_populates="follow_ups")


# ─── Meetings ─────────────────────────────────────────────────────────────────

class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("calls.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("Scheduled", "Completed", "Cancelled", "No Show", name="meeting_status"),
        default="Scheduled", nullable=False
    )
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    calendar_event_id: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    calendar_provider: Mapped[str] = mapped_column(String(50), default="none", nullable=False)
    created_at: Mapped[datetime] = now_utc()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="meetings")
    lead: Mapped[Optional["Lead"]] = relationship(back_populates="meetings")


# ─── Audit Logs ───────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = uuid_pk()
    workspace_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(200), nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), default="", nullable=False)
    created_at: Mapped[datetime] = now_utc()

    workspace: Mapped[Optional["Workspace"]] = relationship(back_populates="audit_logs")
    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")
