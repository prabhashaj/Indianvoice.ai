"""
VoxSales AI — Auth Router
POST /auth/register, POST /auth/login, POST /auth/refresh, GET /auth/me
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    AuthContext,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import User, Workspace, WorkspaceMember

router = APIRouter()


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    workspace_name: str = "My Workspace"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user and create their initial workspace."""
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.flush()

    # Create workspace + make user owner
    workspace = Workspace(name=body.workspace_name)
    db.add(workspace)
    await db.flush()

    member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
    db.add(member)
    await db.commit()
    await db.refresh(user)
    await db.refresh(workspace)

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(workspace.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return access + refresh tokens."""
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Get the user's primary workspace (first owned workspace)
    ws_result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(WorkspaceMember.created_at)
        .limit(1)
    )
    member = ws_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="No workspace found for this user")

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(member.workspace_id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Issue a new access token from a valid refresh token."""
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    try:
        user_uuid = uuid.UUID(user_id_str)
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed user ID in token")

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    ws_result = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.user_id == user.id).limit(1)
    )
    member = ws_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="No workspace found")

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(member.workspace_id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


class MeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    workspace_id: str
    role: str


@router.get("/me", response_model=MeResponse)
async def me(ctx: AuthContext = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return the current authenticated user's profile."""
    result = await db.execute(select(User).where(User.id == ctx.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        workspace_id=str(ctx.workspace_id),
        role=ctx.role,
    )
