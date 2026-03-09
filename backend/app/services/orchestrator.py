"""Story Orchestrator — the page pipeline coordinator.

Receives tool calls from the Live API and coordinates:
1. Story text generation (Gemini 3 Flash)
2. Illustration generation (Imagen)
3. Narration generation (TTS) — in parallel
4. State updates
5. Response routing
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable, Awaitable

from app.models.story import (
    Character,
    Direction,
    DirectionType,
    Page,
    StoryState,
)
from app.services.story_writer import StoryWriterService
from app.services.image_service import ImageService
from app.services.narration import NarrationService
from app.services.safety import SafetyService

logger = logging.getLogger(__name__)


class Orchestrator:
    """Coordinates the page generation pipeline."""

    def __init__(self) -> None:
        self.story_writer = StoryWriterService()
        self.image_service = ImageService()
        self.narration_service = NarrationService()
        self.safety = SafetyService()

    async def handle_tool_call(
        self,
        tool_name: str,
        tool_args: dict[str, Any],
        story_state: StoryState,
        on_page_ready: Callable[[Page], Awaitable[None]],
    ) -> dict[str, Any]:
        """Handle a tool call from the Live API.

        Args:
            tool_name: Name of the tool called.
            tool_args: Arguments from the tool call.
            story_state: The story state to update.
            on_page_ready: Callback to send completed page to frontend.

        Returns:
            Brief response dict for the Live API agent.
        """
        if tool_name == "generate_story_page":
            return await self._generate_page(
                story_state=story_state,
                page_number=tool_args.get("page_number", story_state.current_page + 1),
                user_direction=tool_args.get("user_direction", ""),
                on_page_ready=on_page_ready,
            )
        elif tool_name == "finish_story":
            return await self._finish_story(
                story_state=story_state,
                ending_direction=tool_args.get("ending_direction", ""),
                on_page_ready=on_page_ready,
            )
        else:
            logger.warning("Unknown tool call: %s", tool_name)
            return {"status": "error", "message": f"Unknown tool: {tool_name}"}

    async def _generate_page(
        self,
        story_state: StoryState,
        page_number: int,
        user_direction: str,
        on_page_ready: Callable[[Page], Awaitable[None]],
    ) -> dict[str, Any]:
        """Generate a story page: text + illustration + narration in parallel."""

        # Log the direction
        if user_direction:
            story_state.direction_log.append(
                Direction(
                    page=page_number,
                    type=DirectionType.STEERING,
                    input=user_direction,
                )
            )

        # Step 1: Generate story text
        writer_result = await self.story_writer.generate_page(
            story_state=story_state,
            page_number=page_number,
            user_direction=user_direction,
        )

        page_text = writer_result["text"]

        # Safety check on text
        if not await self.safety.is_text_safe(page_text, story_state.age_setting):
            logger.warning("Page text failed safety check, regenerating...")
            writer_result = await self.story_writer.generate_page(
                story_state=story_state,
                page_number=page_number,
                user_direction=user_direction + " (keep content child-friendly and safe)",
            )
            page_text = writer_result["text"]

        # Step 2: Generate illustration + narration in parallel
        illustration_task = asyncio.create_task(
            self.image_service.generate_illustration(
                scene_description=writer_result["scene_description"],
                style=story_state.style.value,
            )
        )
        narration_task = asyncio.create_task(
            self.narration_service.generate_narration(page_text)
        )

        image_base64, narration_base64 = await asyncio.gather(
            illustration_task,
            narration_task,
            return_exceptions=True,
        )

        # Handle generation failures gracefully
        if isinstance(image_base64, Exception):
            logger.error("Illustration failed: %s", image_base64)
            image_base64 = None
        if isinstance(narration_base64, Exception):
            logger.error("Narration failed: %s", narration_base64)
            narration_base64 = None

        # Step 3: Update story state
        new_page = Page(
            number=page_number,
            text=page_text,
            summary=writer_result["summary"],
            scene_description=writer_result["scene_description"],
            image_base64=image_base64,
            narration_audio_base64=narration_base64,
        )
        story_state.pages.append(new_page)

        # Update characters
        for char_data in writer_result.get("new_characters", []):
            if isinstance(char_data, dict):
                story_state.characters.append(
                    Character(
                        name=char_data.get("name", "Unknown"),
                        traits=char_data.get("traits", []),
                        visual_description=char_data.get("visual_description", ""),
                        first_appearance_page=page_number,
                    )
                )

        # Update world rules
        for rule in writer_result.get("world_rule_changes", []):
            if rule and rule not in story_state.world_rules:
                story_state.world_rules.append(rule)

        # Step 4: Send page to frontend
        await on_page_ready(new_page)

        # Step 5: Return brief response to Live API
        return {
            "status": "success",
            "page_number": page_number,
            "summary": writer_result["summary"],
            "message": f"Page {page_number} is ready! The illustration shows {writer_result['scene_description'][:100]}.",
        }

    async def _finish_story(
        self,
        story_state: StoryState,
        ending_direction: str,
        on_page_ready: Callable[[Page], Awaitable[None]],
    ) -> dict[str, Any]:
        """Generate the final page and mark the story as complete."""
        result = await self._generate_page(
            story_state=story_state,
            page_number=story_state.current_page + 1,
            user_direction=f"This is the FINAL page. Wrap up the story: {ending_direction}",
            on_page_ready=on_page_ready,
        )

        story_state.is_complete = True

        return {
            "status": "complete",
            "total_pages": story_state.current_page,
            "message": "The story is complete! The book is ready to download.",
        }
