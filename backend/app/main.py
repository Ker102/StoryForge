"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.ws import router as ws_router
from app.routes.export import router as export_router

app = FastAPI(
    title="StoryForge API",
    description="Real-time multimodal storybook generator backend",
    version="0.1.0",
)

# CORS — allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ws_router)
app.include_router(export_router, prefix="/export", tags=["export"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "storyforge-backend"}
