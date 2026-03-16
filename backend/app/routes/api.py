"""REST API routes for story management.

Provides endpoints for the library UI to list, view, and delete stories.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Header, HTTPException

from app.middleware.auth import verify_firebase_token
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
    user = await verify_firebase_token(token)
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
    # Verify story exists first
    story = await firestore_service.load_story(user_id, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    success = await firestore_service.delete_story(user_id, story_id)
    if not success:
        raise HTTPException(status_code=500, detail="Internal error deleting story")
    return {"status": "deleted", "id": story_id}


@router.post("/stories/{story_id}/generate-images")
async def generate_images(story_id: str, authorization: str | None = Header(None)):
    """Generate illustrations for all pages of a story (post-story).

    This runs Imagen for each page's scene_description and uploads to Storage.
    """
    import asyncio
    import base64 as b64_mod

    from app.services.image_service import ImageService
    from app.services import storage_service

    user_id = await _get_user_id(authorization)
    story = await firestore_service.load_story(user_id, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    pages = story.get("pages", [])
    if not pages:
        raise HTTPException(status_code=400, detail="Story has no pages")

    style = story.get("style", "watercolour")
    image_svc = ImageService()
    results = []

    for page in pages:
        page_num = page.get("number", 0)
        scene = page.get("scene_description", "")
        if not scene:
            results.append({"page": page_num, "status": "skipped", "reason": "no scene_description"})
            continue
        try:
            image_b64 = await image_svc.generate_illustration(
                scene_description=scene, style=style,
            )
            if image_b64:
                image_url = await storage_service.upload_image(
                    story_id, page_num, b64_mod.b64decode(image_b64),
                )
                # Update page in Firestore
                page["image_url"] = image_url
                results.append({"page": page_num, "status": "ok", "image_url": image_url})
            else:
                results.append({"page": page_num, "status": "failed", "reason": "no image returned"})
        except Exception as e:
            logger.error("Image generation failed for page %d: %s", page_num, e)
            results.append({"page": page_num, "status": "error", "reason": str(e)})

    # Save updated story with image URLs
    try:
        from app.services.firebase import get_firestore_client
        db = get_firestore_client()
        await asyncio.to_thread(
            db.collection("users").document(user_id)
            .collection("stories").document(story_id)
            .update, {"pages": pages}
        )
    except Exception as e:
        logger.error("Failed to update story with image URLs: %s", e)

    return {"status": "complete", "results": results}


@router.post("/stories/{story_id}/generate-narration")
async def generate_narration(story_id: str, authorization: str | None = Header(None)):
    """Generate TTS narration audio for all pages of a story (post-story).

    Creates narration audio for each page's text and uploads to Storage.
    """
    import asyncio
    import base64 as b64_mod

    from app.services.narration import NarrationService
    from app.services import storage_service

    user_id = await _get_user_id(authorization)
    story = await firestore_service.load_story(user_id, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    pages = story.get("pages", [])
    if not pages:
        raise HTTPException(status_code=400, detail="Story has no pages")

    narration_svc = NarrationService()
    results = []

    for page in pages:
        page_num = page.get("number", 0)
        text = page.get("text", "")
        if not text:
            results.append({"page": page_num, "status": "skipped", "reason": "no text"})
            continue
        try:
            audio_b64 = await narration_svc.generate_narration(text)
            if audio_b64:
                narration_url = await storage_service.upload_audio(
                    story_id, page_num, b64_mod.b64decode(audio_b64),
                )
                page["narration_url"] = narration_url
                results.append({"page": page_num, "status": "ok", "narration_url": narration_url})
            else:
                results.append({"page": page_num, "status": "failed", "reason": "no audio returned"})
        except Exception as e:
            logger.error("Narration generation failed for page %d: %s", page_num, e)
            results.append({"page": page_num, "status": "error", "reason": str(e)})

    # Save updated story with narration URLs
    try:
        from app.services.firebase import get_firestore_client
        db = get_firestore_client()
        await asyncio.to_thread(
            db.collection("users").document(user_id)
            .collection("stories").document(story_id)
            .update, {"pages": pages}
        )
    except Exception as e:
        logger.error("Failed to update story with narration URLs: %s", e)

    return {"status": "complete", "results": results}
