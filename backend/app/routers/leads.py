"""
VoxSales AI — Leads Router
Full CRUD + CSV import + DNC enforcement with workspace isolation.
"""
import csv
import io
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_current_user
from app.database import get_db
from app.models import Lead

router = APIRouter()


class LeadCreate(BaseModel):
    name: str
    company: str = ""
    title: str = ""
    phone: str = ""
    email: str = ""
    location: str = ""
    industry: str = ""
    campaign_id: Optional[str] = None
    agent_id: Optional[str] = None
    owner: str = ""
    metadata: dict = {}


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = None
    campaign_id: Optional[str] = None
    agent_id: Optional[str] = None
    intent_score: Optional[int] = None
    lead_score: Optional[int] = None
    sentiment: Optional[str] = None
    pain_points: Optional[List[str]] = None
    objections: Optional[List[str]] = None
    summary: Optional[str] = None
    next_action: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None
    do_not_contact: Optional[bool] = None
    consent_given: Optional[bool] = None


class LeadResponse(BaseModel):
    id: str
    workspace_id: str
    campaign_id: Optional[str]
    agent_id: Optional[str]
    name: str
    company: str
    title: str
    phone: str
    email: str
    location: str
    industry: str
    status: str
    do_not_contact: bool
    consent_given: bool
    intent_score: int
    lead_score: int
    sentiment: str
    pain_points: List[str]
    objections: List[str]
    summary: str
    next_action: str
    notes: str
    owner: str

    @classmethod
    def from_orm(cls, lead: Lead) -> "LeadResponse":
        return cls(
            id=str(lead.id),
            workspace_id=str(lead.workspace_id),
            campaign_id=str(lead.campaign_id) if lead.campaign_id else None,
            agent_id=str(lead.agent_id) if lead.agent_id else None,
            name=lead.name,
            company=lead.company,
            title=lead.title,
            phone=lead.phone,
            email=lead.email,
            location=lead.location,
            industry=lead.industry,
            status=lead.status,
            do_not_contact=lead.do_not_contact,
            consent_given=lead.consent_given,
            intent_score=lead.intent_score,
            lead_score=lead.lead_score,
            sentiment=lead.sentiment,
            pain_points=lead.pain_points or [],
            objections=lead.objections or [],
            summary=lead.summary,
            next_action=lead.next_action,
            notes=lead.notes,
            owner=lead.owner,
        )


@router.get("", response_model=List[LeadResponse])
async def list_leads(
    campaign_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Lead).where(
        Lead.workspace_id == ctx.workspace_id,
        Lead.do_not_contact == False,
    )
    if campaign_id:
        try:
            stmt = stmt.where(Lead.campaign_id == uuid.UUID(campaign_id))
        except Exception:
            return []

    if status:
        stmt = stmt.where(Lead.status == status)
    if search:
        term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Lead.name.ilike(term),
                Lead.company.ilike(term),
                Lead.email.ilike(term),
                Lead.title.ilike(term),
            )
        )
    stmt = stmt.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [LeadResponse.from_orm(l) for l in result.scalars().all()]


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lead = Lead(
        workspace_id=ctx.workspace_id,
        campaign_id=uuid.UUID(body.campaign_id) if body.campaign_id else None,
        agent_id=uuid.UUID(body.agent_id) if body.agent_id else None,
        name=body.name,
        company=body.company,
        title=body.title,
        phone=body.phone,
        email=body.email,
        location=body.location,
        industry=body.industry,
        owner=body.owner,
        metadata_=body.metadata,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return LeadResponse.from_orm(lead)


def _parse_lead_uuid(lead_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(lead_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Lead not found. Please verify the URL.")


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lead_uuid = _parse_lead_uuid(lead_id)
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_uuid,
            Lead.workspace_id == ctx.workspace_id,
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found. Please verify the URL.")
    return LeadResponse.from_orm(lead)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def patch_lead(
    lead_id: str,
    body: LeadUpdate,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lead_uuid = _parse_lead_uuid(lead_id)
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_uuid,
            Lead.workspace_id == ctx.workspace_id,
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found. Please verify the URL.")

    for field, value in body.model_dump(exclude_none=True).items():
        if field == "campaign_id":
            lead.campaign_id = uuid.UUID(value) if value else None
        elif field == "agent_id":
            lead.agent_id = uuid.UUID(value) if value else None
        elif field == "metadata":
            lead.metadata_ = value
        else:
            setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return LeadResponse.from_orm(lead)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lead_uuid = _parse_lead_uuid(lead_id)
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_uuid,
            Lead.workspace_id == ctx.workspace_id,
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found. Please verify the URL.")
    await db.delete(lead)
    await db.commit()


@router.post("/import", status_code=201)
async def import_leads_csv(
    file: UploadFile = File(...),
    campaign_id: Optional[str] = None,
    ctx: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Import leads from CSV. Required columns: name, phone.
    Optional: company, title, email, location, industry, owner.
    Returns count of imported leads and any rows that failed validation.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    text = content.decode("utf-8-sig")  # handle BOM
    reader = csv.DictReader(io.StringIO(text))

    required_cols = {"name", "phone"}
    if not reader.fieldnames or not required_cols.issubset(
        {f.strip().lower() for f in reader.fieldnames}
    ):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain at minimum: {required_cols}",
        )

    imported = 0
    errors = []
    leads_to_add = []

    for i, row in enumerate(reader, start=2):  # Row 1 is header
        row = {k.strip().lower(): v.strip() for k, v in row.items()}
        name = row.get("name", "").strip()
        phone = row.get("phone", "").strip()
        if not name or not phone:
            errors.append({"row": i, "error": "Missing required field: name or phone"})
            continue
        lead = Lead(
            workspace_id=ctx.workspace_id,
            campaign_id=uuid.UUID(campaign_id) if campaign_id else None,
            name=name,
            phone=phone,
            company=row.get("company", ""),
            title=row.get("title", ""),
            email=row.get("email", ""),
            location=row.get("location", ""),
            industry=row.get("industry", ""),
            owner=row.get("owner", ""),
        )
        leads_to_add.append(lead)
        imported += 1

    db.add_all(leads_to_add)
    await db.commit()

    return {
        "imported": imported,
        "errors": errors,
        "campaign_id": campaign_id,
    }
