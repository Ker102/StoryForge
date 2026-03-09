"""Story Writer Service — calls Gemini 3 Flash for page generation.

This service is STATELESS per call. All story context is injected via the
StoryState's get_writer_context() method. The backend (StoryStateManager)
is the memory, not this service.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings
from app.models.story import StoryState

logger = logging.getLogger(__name__)


class StoryWriterService:
    """Generates story pages using Gemini 3 Flash."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = settings.writer_model

    async def generate_page(
        self,
        story_state: StoryState,
        page_number: int,
        user_direction: str | None = None,
    ) -> dict[str, Any]:
        """Generate a single story page.

        Args:
            story_state: The complete story state (single source of truth).
            page_number: Which page to generate.
            user_direction: Optional new user direction for this page.

        Returns:
            Parsed dict with keys:
            - text: full story page text
            - summary: one-line summary
            - scene_description: visual description for illustrator
            - new_characters: list of new character dicts
            - world_rule_changes: list of new world rules
        """
        prompt = story_state.get_writer_context(page_number, user_direction)

        logger.info(
            "Generating page %d with %d chars of context",
            page_number,
            len(prompt),
        )

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.9,  # creative but coherent
            ),
        )

        try:
            result = json.loads(response.text)
        except (json.JSONDecodeError, AttributeError) as e:
            logger.error("Failed to parse writer response: %s", e)
            # Fallback: wrap raw text as page text
            result = {
                "text": response.text or "The story continues...",
                "summary": "Page generated with parsing fallback",
                "scene_description": "",
                "new_characters": [],
                "world_rule_changes": [],
            }

        # Ensure all expected keys exist
        result.setdefault("text", "")
        result.setdefault("summary", "")
        result.setdefault("scene_description", "")
        result.setdefault("new_characters", [])
        result.setdefault("world_rule_changes", [])

        logger.info(
            "Page %d generated: %d chars, summary: %s",
            page_number,
            len(result["text"]),
            result["summary"][:80],
        )

        return result
