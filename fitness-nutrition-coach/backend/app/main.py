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

# Bedrock diagnostic endpoint
@app.get("/health/bedrock")
async def bedrock_health():
    """Test Nova Micro connection and return the real error if it fails."""
    import json, boto3
    from app.core.config import settings as s
    result = {
        "region": s.AWS_REGION,
        "model": "amazon.nova-micro-v1:0",
        "has_access_key": bool(s.AWS_ACCESS_KEY_ID),
        "has_secret_key": bool(s.AWS_SECRET_ACCESS_KEY),
        "kb_id": s.BEDROCK_KNOWLEDGE_BASE_ID or "not set",
    }
    try:
        creds = {}
        if s.AWS_ACCESS_KEY_ID and s.AWS_SECRET_ACCESS_KEY:
            creds = {"aws_access_key_id": s.AWS_ACCESS_KEY_ID, "aws_secret_access_key": s.AWS_SECRET_ACCESS_KEY}
        client = boto3.client("bedrock-runtime", region_name=s.AWS_REGION, **creds)
        body = json.dumps({
            "messages": [{"role": "user", "content": [{"text": "say ok"}]}],
            "inferenceConfig": {"maxTokens": 10},
        })
        resp = client.invoke_model(modelId="amazon.nova-micro-v1:0", body=body)
        text = json.loads(resp["body"].read())["output"]["message"]["content"][0]["text"]
        result["status"] = "ok"
        result["response"] = text
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
    return result

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
