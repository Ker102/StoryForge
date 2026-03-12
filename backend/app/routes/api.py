"""REST API routes for story management.

Provides endpoints for the library UI to list, view, and delete stories.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Header, HTTPException

from app.middleware.auth import verify_ws_token
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_user_id(authorization: str | None = Header(None)) -> str:
    """Extract and verify the Firebase user ID from the Authorization header.

    Expects: Authorization: Bearer <firebase-id-token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")

    token = authorization.removeprefix("Bearer ").strip()
    user = await verify_ws_token(token)
    if not user or "uid" not in user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user["uid"]


@router.get("/stories")
async def list_stories(authorization: str | None = Header(None)):
    """List all stories for the authenticated user."""
    user_id = await _get_user_id(authorization)
    stories = await firestore_service.list_stories(user_id)
    return {"stories": stories}


@router.get("/stories/{story_id}")
async def get_story(story_id: str, authorization: str | None = Header(None)):
    """Get full story data by ID."""
    user_id = await _get_user_id(authorization)
    story = await firestore_service.load_story(user_id, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.delete("/stories/{story_id}")
async def delete_story(story_id: str, authorization: str | None = Header(None)):
    """Delete a story by ID."""
    user_id = await _get_user_id(authorization)
    success = await firestore_service.delete_story(user_id, story_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete story")
    return {"status": "deleted", "id": story_id}
