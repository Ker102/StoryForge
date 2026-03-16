"""Firestore persistence for story data.

Stores stories in: users/{uid}/stories/{session_id}
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

from app.models.story import StoryState
from app.services.firebase import get_firestore_client

logger = logging.getLogger(__name__)


def _story_to_doc(story_state: StoryState) -> dict[str, Any]:
    """Convert StoryState to a Firestore-safe dict."""
    pages = []
    for page in story_state.pages:
        pages.append(
            {
                "number": page.number,
                "text": page.text,
                "summary": page.summary,
                "scene_description": page.scene_description,
                "image_url": page.image_url,
                "narration_url": page.narration_url,
            }
        )

    characters = []
    for char in story_state.characters:
        characters.append(
            {
                "name": char.name,
                "traits": char.traits,
                "visual_description": char.visual_description,
                "first_appearance_page": char.first_appearance_page,
            }
        )

    return {
        "session_id": story_state.session_id,
        "style": story_state.style.value,
        "age_setting": story_state.age_setting.value,
        "title": story_state.title,
        "seed": story_state.seed,
        "current_page": story_state.current_page,
        "is_complete": story_state.is_complete,
        "pages": pages,
        "characters": characters,
        "world_rules": story_state.world_rules,
        "updated_at": datetime.now(UTC).isoformat(),
    }


async def save_story(user_id: str, story_state: StoryState) -> None:
    """Save or update a story in Firestore.

    Args:
        user_id: Firebase UID.
        story_state: The current story state to persist.
    """
    try:
        db = get_firestore_client()
        doc_ref = (
            db.collection("users")
            .document(user_id)
            .collection("stories")
            .document(story_state.session_id)
        )
        await asyncio.to_thread(doc_ref.set, _story_to_doc(story_state), merge=True)
        logger.info(
            "Saved story %s for user %s",
            story_state.session_id,
            user_id,
        )
    except FileNotFoundError:
        logger.warning("Firebase not configured — story not saved")
    except Exception as e:
        logger.error("Failed to save story: %s", e, exc_info=True)


async def list_stories(user_id: str) -> list[dict[str, Any]]:
    """List all stories for a user.

    Args:
        user_id: Firebase UID.

    Returns:
        List of story summary dicts (id, title, style, pages, etc.)
    """
    try:
        db = get_firestore_client()
        stories_ref = (
            db.collection("users")
            .document(user_id)
            .collection("stories")
            .order_by("updated_at", direction="DESCENDING")
        )
        docs = await asyncio.to_thread(lambda: list(stories_ref.stream()))
        results = []
        for doc in docs:
            data = doc.to_dict()
            results.append(
                {
                    "id": doc.id,
                    "title": data.get("title", "Untitled Story"),
                    "style": data.get("style", "watercolour"),
                    "current_page": data.get("current_page", 0),
                    "is_complete": data.get("is_complete", False),
                    "page_count": len(data.get("pages", [])),
                    "updated_at": data.get("updated_at"),
                }
            )
        return results
    except FileNotFoundError:
        logger.warning("Firebase not configured — returning empty library")
        return []
    except Exception as e:
        logger.error("Failed to list stories: %s", e, exc_info=True)
        return []


async def load_story(user_id: str, session_id: str) -> dict[str, Any] | None:
    """Load a single story from Firestore.

    Args:
        user_id: Firebase UID.
        session_id: The story session ID.

    Returns:
        Story data dict, or None if not found.
    """
    try:
        db = get_firestore_client()
        doc_ref = (
            db.collection("users").document(user_id).collection("stories").document(session_id)
        )
        doc = await asyncio.to_thread(doc_ref.get)
        if doc.exists:
            return doc.to_dict()
        return None
    except FileNotFoundError:
        logger.warning("Firebase not configured — cannot load story")
        return None
    except Exception as e:
        logger.error("Failed to load story: %s", e, exc_info=True)
        return None


async def delete_story(user_id: str, session_id: str) -> bool:
    """Delete a story from Firestore.

    Args:
        user_id: Firebase UID.
        session_id: The story session ID.

    Returns:
        True if deleted successfully, False otherwise.
    """
    try:
        db = get_firestore_client()
        doc_ref = (
            db.collection("users").document(user_id).collection("stories").document(session_id)
        )
        await asyncio.to_thread(doc_ref.delete)
        logger.info("Deleted story %s for user %s", session_id, user_id)
        return True
    except Exception as e:
        logger.error("Failed to delete story: %s", e, exc_info=True)
        return False
