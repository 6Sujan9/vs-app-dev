"""FastAPI application factory."""

import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.config import settings
from app.api.routes import auth, user, workout, nutrition, chat, progress, integration, database_routes, integration_endpoints
from app.services.bedrock_agent import BedrockAgent
from app.database import engine
from app.models import Base

# Setup logging
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Fitness and Nutrition Coach API",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Log CORS configuration
logger.info(f"🔵 [CORS] Allowed Origins: {settings.ALLOWED_ORIGINS}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(workout.router)
app.include_router(nutrition.router)
app.include_router(chat.router)
app.include_router(progress.router)
app.include_router(integration.router)
app.include_router(database_routes.router)
app.include_router(integration_endpoints.router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }

# Event handlers
@app.on_event("startup")
async def startup_event():
    """Startup event."""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event."""
    print(f"Shutting down {settings.APP_NAME}")


# ── Bedrock Knowledge Base chat endpoint ──────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # pass back to keep multi-turn context


@app.post("/chat")
async def bedrock_chat(request: ChatRequest):
    """Query the Bedrock Knowledge Base with retrieve_and_generate."""
    if not settings.BEDROCK_KNOWLEDGE_BASE_ID:
        raise HTTPException(status_code=503, detail="Knowledge Base not configured")
    try:
        agent = BedrockAgent()
        return agent.query(request.message, request.session_id)
    except Exception as e:
        logger.error("Bedrock chat error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
