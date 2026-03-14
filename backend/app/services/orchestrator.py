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
import time
from collections.abc import Awaitable, Callable
from typing import Any

from app.models.story import (
    Character,
    Direction,
    DirectionType,
    Page,
    StoryState,
)
from app.services.image_service import ImageService
from app.services.narration import NarrationService
from app.services.safety import SafetyService
from app.services.story_writer import StoryWriterService

logger = logging.getLogger(__name__)


class Orchestrator:
    """Coordinates the page generation pipeline."""

    def __init__(self) -> None:
        self.story_writer = StoryWriterService()
        self.image_service = ImageService()
        self.narration_service = NarrationService()
        self.safety = SafetyService()

        # Lazy import to avoid circular imports
        from app.observability import metrics, tracer

        self._tracer = tracer
        self._metrics = metrics

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
        from app.observability.trace import SpanStatus

        span = self._tracer.start_span(
            f"orchestrator.{tool_name}",
            attributes={"tool_name": tool_name},
        )
        self._metrics.tool_calls_total.inc(labels={"tool": tool_name, "source": "orchestrator"})
        _start = time.time()

        try:
            if tool_name == "generate_story_page":
                # Server-side validation: override model-provided page_number
                expected_page = story_state.current_page + 1
                provided_page = tool_args.get("page_number", expected_page)
                if provided_page != expected_page:
                    logger.warning(
                        "Model provided page_number=%d, expected=%d — overriding",
                        provided_page,
                        expected_page,
                    )
                    span.add_event("page_number_override", {
                        "provided": provided_page, "expected": expected_page
                    })
                result = await self._generate_page(
                    story_state=story_state,
                    page_number=expected_page,
                    user_direction=tool_args.get("user_direction", ""),
                    on_page_ready=on_page_ready,
                    parent_span=span,
                )
            elif tool_name == "finish_story":
                result = await self._finish_story(
                    story_state=story_state,
                    ending_direction=tool_args.get("ending_direction", ""),
                    on_page_ready=on_page_ready,
                    parent_span=span,
                )
            else:
                logger.warning("Unknown tool call: %s", tool_name)
                span.add_event("unknown_tool")
                result = {"status": "error", "message": f"Unknown tool: {tool_name}"}

            self._tracer.end_span(span, SpanStatus.OK)
            self._metrics.tool_duration.observe(time.time() - _start)
            return result

        except Exception as exc:
            span.add_event("error", {"error.type": type(exc).__name__})
            self._tracer.end_span(span, SpanStatus.ERROR)
            self._metrics.errors.inc(labels={"tool": tool_name})
            raise

    async def _generate_page(
        self,
        story_state: StoryState,
        page_number: int,
        user_direction: str,
        on_page_ready: Callable[[Page], Awaitable[None]],
        parent_span=None,
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

        from app.observability.trace import SpanStatus

        # Step 1: Generate story text
        write_span = self._tracer.start_span("story_writer.generate_page", parent=parent_span)
        writer_result = await self.story_writer.generate_page(
            story_state=story_state,
            page_number=page_number,
            user_direction=user_direction,
        )
        self._tracer.end_span(write_span, SpanStatus.OK)

        page_text = writer_result["text"]

        # Safety check on text
        safety_span = self._tracer.start_span("safety.check", parent=parent_span)
        if not self.safety.is_text_safe(page_text, story_state.age_setting):
            logger.warning("Page text failed safety check, regenerating...")
            self._metrics.safety_blocks.inc(labels={"source": "orchestrator"})
            safety_span.add_event("blocked", {"attempt": 1})
            writer_result = await self.story_writer.generate_page(
                story_state=story_state,
                page_number=page_number,
                user_direction=user_direction + " (keep content child-friendly and safe)",
            )
            page_text = writer_result["text"]
        self._tracer.end_span(safety_span, SpanStatus.OK)

        # Step 2: Generate illustration + narration in parallel
        illustration_task = asyncio.create_task(
            self.image_service.generate_illustration(
                scene_description=writer_result["scene_description"],
                style=story_state.style.value,
            )
        )
        narration_task = asyncio.create_task(self.narration_service.generate_narration(page_text))

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

        # Update characters (deduplicate by name)
        existing_names = {c.name.lower().strip() for c in story_state.characters}
        for char_data in writer_result.get("new_characters", []):
            if isinstance(char_data, dict):
                name = char_data.get("name", "Unknown")
                if name.lower().strip() not in existing_names:
                    story_state.characters.append(
                        Character(
                            name=name,
                            traits=char_data.get("traits", []),
                            visual_description=char_data.get("visual_description", ""),
                            first_appearance_page=page_number,
                        )
                    )
                    existing_names.add(name.lower().strip())

        # Update world rules
        for rule in writer_result.get("world_rule_changes", []):
            if rule and rule not in story_state.world_rules:
                story_state.world_rules.append(rule)

        # Step 4: Send page to frontend
        await on_page_ready(new_page)

        # Record metrics
        self._metrics.pages_generated.inc()
        self._metrics.page_text_length.observe(len(page_text))

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
        parent_span=None,
    ) -> dict[str, Any]:
        """Generate the final page and mark the story as complete."""
        await self._generate_page(
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
