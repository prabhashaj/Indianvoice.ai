"""
VoxSales AI — FastAPI Backend
Main application factory.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import auth, agents, campaigns, leads, calls, follow_ups, analytics, livekit_tokens, webhooks, telephony, agent_chat

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("Starting VoxSales AI backend (env=%s)", settings.app_env)
    # Optionally create tables in dev (use Alembic in production)
    if settings.app_env == "development":
        from app.database import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Shutting down VoxSales AI backend")
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Indianvoice.ai",
        description="India's #1 AI voice calling platform. Hindi, Telugu & English. TRAI compliant. Exotel powered.",
        version="1.0.0",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
        lifespan=lifespan,
    )

    # CORS — allow explicitly configured origins and any local dev server port
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
    app.include_router(agents.router, prefix="/agents", tags=["AI Agents"])
    app.include_router(agent_chat.router, prefix="/agents", tags=["AI Agents"])
    app.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
    app.include_router(leads.router, prefix="/leads", tags=["Leads CRM"])
    app.include_router(calls.router, prefix="/calls", tags=["Calls"])
    app.include_router(follow_ups.router, prefix="/follow-ups", tags=["Follow-ups"])
    app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
    app.include_router(livekit_tokens.router, prefix="/livekit", tags=["LiveKit"])
    app.include_router(telephony.router, prefix="/telephony", tags=["Telephony"])
    app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "version": "1.0.0"}

    @app.get("/ready", tags=["Health"])
    async def ready():
        """Readiness check — verifies DB connection."""
        try:
            from sqlalchemy import text
            from app.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ready"}
        except Exception as e:
            logger.error("Readiness check failed: %s", e)
            return {"status": "not_ready", "error": str(e)}

    return app


app = create_app()
