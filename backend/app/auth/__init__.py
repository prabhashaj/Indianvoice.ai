"""
VoxSales AI — Authentication
JWT token creation/validation, password hashing, and FastAPI dependencies.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)


# ─── Password ─────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ─── JWT ──────────────────────────────────────────────────────────────────────

def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = {**data, "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, workspace_id: str) -> str:
    return _create_token(
        {"sub": user_id, "workspace_id": workspace_id, "type": "access"},
        timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=settings.jwt_refresh_token_expire_days),
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


# ─── LiveKit token ────────────────────────────────────────────────────────────

def create_livekit_token(room_name: str, participant_identity: str, participant_name: str, grants: dict) -> str:
    """
    Create a LiveKit access token for browser or agent participants.
    Uses the official LiveKit JWT format.
    """
    from livekit.api import AccessToken, VideoGrants

    token = (
        AccessToken(api_key=settings.livekit_api_key, api_secret=settings.livekit_api_secret)
        .with_identity(participant_identity)
        .with_name(participant_name)
        .with_grants(VideoGrants(**grants))
    )
    return token.to_jwt()


# ─── FastAPI dependencies ─────────────────────────────────────────────────────

class AuthContext:
    def __init__(self, user_id: uuid.UUID, workspace_id: uuid.UUID, role: str = "member"):
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.role = role


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    """Dependency: validates JWT and returns AuthContext with user + workspace IDs."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id_str = payload.get("sub")
    workspace_id_str = payload.get("workspace_id")
    if not user_id_str or not workspace_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

    # Verify workspace membership
    from app.models import WorkspaceMember
    from sqlalchemy import select

    stmt = select(WorkspaceMember).where(
        WorkspaceMember.user_id == uuid.UUID(user_id_str),
        WorkspaceMember.workspace_id == uuid.UUID(workspace_id_str),
    )
    result = await db.execute(stmt)
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this workspace")

    return AuthContext(
        user_id=uuid.UUID(user_id_str),
        workspace_id=uuid.UUID(workspace_id_str),
        role=member.role,
    )


def require_role(*roles: str):
    """Dependency factory: ensure the current user has one of the specified roles."""
    async def _check(ctx: AuthContext = Depends(get_current_user)) -> AuthContext:
        if ctx.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return ctx
    return _check
