"""FastAPI application entrypoint."""

import os
from dotenv import dotenv_values

# Load .env.storyforge but ONLY export GOOGLE_API_KEY to os.environ.
# Reason: The ADK's internal Pydantic models use extra="forbid" and crash if
# they see unexpected env vars like FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, etc.
# Our own Settings class loads the full file via its env_file config.
_env_vars = dotenv_values(".env.storyforge")
google_api_key = _env_vars.get("GOOGLE_API_KEY")
if google_api_key:
    os.environ.setdefault("GOOGLE_API_KEY", google_api_key)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.api import router as api_router
from app.routes.export import router as export_router
from app.routes.ws import router as ws_router
from app.observability.dashboard import router as obs_router

app = FastAPI(
    title="StoryForge API",
    description="Real-time multimodal storybook generator backend",
    version="0.1.0",
)

# CORS — permissive during development
# TODO: restrict allow_origins to frontend URL in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # cannot use True with wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ws_router)
app.include_router(export_router, prefix="/export", tags=["export"])
app.include_router(api_router, prefix="/api", tags=["api"])
app.include_router(obs_router, prefix="/observability", tags=["observability"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "storyforge-backend"}
