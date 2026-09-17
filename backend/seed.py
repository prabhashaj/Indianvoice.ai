"""
VoxSales AI — Seed Script
Populates the database with realistic demo data matching the frontend mock data.
Safe to run multiple times (idempotent on workspace name).

Usage:
    python seed.py
"""
import asyncio
import os
import sys

# Add parent dir so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.auth import hash_password
from app.database import engine, AsyncSessionLocal
from app.models import (
    Agent, Campaign, Lead, User, Workspace, WorkspaceMember, FollowUp
)


async def seed():
    async with AsyncSessionLocal() as db:
        # ── User + Workspace ─────────────────────────────────────────────────
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.email == "prabhash@northstar.io"))
        if existing.scalar_one_or_none():
            print("[INFO] Database already seeded with prabhash@northstar.io.")
            return

        user = User(
            email="prabhash@northstar.io",
            hashed_password=hash_password("demo1234"),
            full_name="Prabhash Jain",
        )
        db.add(user)
        await db.flush()

        workspace = Workspace(name="Northstar Revenue", plan="Scale")
        db.add(workspace)
        await db.flush()

        db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner"))

        # ── Agents ───────────────────────────────────────────────────────────
        agents_data = [
            dict(name="Alex", description="Outbound B2B Sales Representative",
                 voice="Nova — Confident US Male", languages=["English"],
                 industry="B2B SaaS", objective="Book qualified discovery calls",
                 tone="Professional, consultative", status="Active",
                 total_calls=1842, conversion_rate=9.4),
            dict(name="Ananya", description="Indian SMB Sales Agent",
                 voice="Meera — Warm IN Female", languages=["English", "Hindi"],
                 industry="SMB Automation", objective="Qualify inbound SMB interest",
                 tone="Friendly, conversational", status="Active",
                 total_calls=982, conversion_rate=7.8),
            dict(name="Marcus", description="Real Estate Appointment Setter",
                 voice="Atlas — Calm US Male", languages=["English", "Spanish"],
                 industry="Real Estate", objective="Set property viewing appointments",
                 tone="Assertive, concise", status="Active",
                 total_calls=1416, conversion_rate=11.2),
            dict(name="Sofia", description="Healthcare Outreach Specialist",
                 voice="Lyra — Soft US Female", languages=["English"],
                 industry="Healthcare", objective="Compliance-safe practice outreach",
                 tone="Empathetic, precise", status="Paused",
                 total_calls=604, conversion_rate=6.1),
            dict(name="Dev", description="E-commerce Retention Agent",
                 voice="Orion — Bright IN Male", languages=["English", "Hindi"],
                 industry="E-commerce", objective="Win back lapsed customers",
                 tone="Casual, upbeat", status="Draft",
                 total_calls=312, conversion_rate=5.4),
        ]
        agent_objs = []
        for a in agents_data:
            agent = Agent(workspace_id=workspace.id, **a)
            db.add(agent)
            agent_objs.append(agent)
        await db.flush()

        # ── Campaigns ────────────────────────────────────────────────────────
        campaigns_data = [
            dict(name="SaaS Scale-Up Series", status="Running",
                 audience="Mid-market SaaS CFOs", total_leads=2840,
                 connected=1632, qualified=296, meetings=102, completed=1842,
                 total_calls=2840, schedule_days=["Mon","Tue","Wed","Thu","Fri"]),
            dict(name="SMB Automation Outreach", status="Running",
                 audience="SMB operations leads", total_leads=1480,
                 connected=788, qualified=142, meetings=48, completed=980,
                 total_calls=1480, schedule_days=["Mon","Tue","Wed","Thu","Fri"]),
            dict(name="Real Estate Investors Q4", status="Paused",
                 audience="Property investment professionals", total_leads=960,
                 connected=524, qualified=96, meetings=38, completed=620,
                 total_calls=960, schedule_days=["Mon","Wed","Fri"]),
            dict(name="Healthcare SaaS Prospects", status="Scheduled",
                 audience="Healthcare CIOs", total_leads=640,
                 connected=0, qualified=0, meetings=0, completed=0,
                 total_calls=0, schedule_days=["Tue","Thu"]),
            dict(name="E-commerce Retention Drive", status="Draft",
                 audience="Lapsed e-commerce customers", total_leads=380,
                 connected=0, qualified=0, meetings=0, completed=0,
                 total_calls=0, schedule_days=["Mon","Tue","Wed","Thu","Fri"]),
        ]
        campaign_objs = []
        for i, c in enumerate(campaigns_data):
            agent = agent_objs[i % len(agent_objs)]
            campaign = Campaign(
                workspace_id=workspace.id,
                agent_id=agent.id,
                **c,
            )
            db.add(campaign)
            campaign_objs.append(campaign)
        await db.flush()

        # ── Sample leads ─────────────────────────────────────────────────────
        leads_data = [
            dict(name="Rahul Sharma", company="TechWave Solutions", title="VP of Operations",
                 phone="+91 98765 43210", email="rahul@techwave.io", location="Bengaluru, IN",
                 industry="B2B SaaS", status="Interested", intent_score=86, lead_score=82,
                 sentiment="Positive", pain_points=["Manual lead management", "Poor handoff"],
                 objections=[], summary="Interested in reducing sales overhead and improving response time.",
                 next_action="Demo scheduled for Friday 3pm"),
            dict(name="Priya Menon", company="Zephyr Analytics", title="Co-Founder",
                 phone="+91 87654 32109", email="priya@zephyr.ai", location="Mumbai, IN",
                 industry="AI / Analytics", status="Qualified", intent_score=74, lead_score=71,
                 sentiment="Neutral"),
            dict(name="James O'Brien", company="Atlantic Realty Group", title="Director of Acquisitions",
                 phone="+1 617 555 0192", email="james@atlanticrealty.com", location="Boston, US",
                 industry="Real Estate", status="Meeting", intent_score=92, lead_score=88,
                 sentiment="Positive"),
            dict(name="Kenji Tanaka", company="Sakura Mobility", title="Head of Fleet Operations",
                 phone="+81 3 5555 1234", email="kenji@sakura-mobility.jp", location="Tokyo, JP",
                 industry="Transportation", status="Contacted", intent_score=44, lead_score=38,
                 sentiment="Neutral"),
        ]
        for i, lead_data in enumerate(leads_data):
            lead = Lead(
                workspace_id=workspace.id,
                campaign_id=campaign_objs[i % len(campaign_objs)].id,
                **lead_data,
            )
            db.add(lead)
        await db.flush()

        # ── Follow-ups ────────────────────────────────────────────────────────
        followups = [
            dict(reason="Requested demo after call", action="Send Calendly link + product one-pager", priority="High"),
            dict(reason="Budget approval next week", action="Follow up with decision-making team", priority="High"),
            dict(reason="Needs Japanese voice coverage", action="Confirm JP voice availability date", priority="Medium"),
        ]
        for fu_data in followups:
            fu = FollowUp(workspace_id=workspace.id, **fu_data)
            db.add(fu)

        await db.commit()
        print("[SUCCESS] Seed complete!")
        print(f"   Workspace: {workspace.name}")
        print(f"   User: {user.email} / password: demo1234")
        print(f"   Agents: {len(agent_objs)}")
        print(f"   Campaigns: {len(campaign_objs)}")
        print(f"   Leads: {len(leads_data)}")


if __name__ == "__main__":
    asyncio.run(seed())
