"""Quill — the StoryForge creative companion, defined as an ADK Agent.

Quill uses the Gemini Live API for voice conversation and has two tools:
- generate_story_page: triggers the full write → illustrate → narrate pipeline
- finish_story: wraps up the story and marks it for export
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from google.adk import Agent
from google.adk.tools import ToolContext

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

# ---------------------------------------------------------------------------
# Lazy service getters (avoid import-time init when config isn't ready)
# ---------------------------------------------------------------------------
_story_writer: StoryWriterService | None = None
_image_service: ImageService | None = None
_narration_service: NarrationService | None = None
_safety: SafetyService | None = None


def _get_story_writer() -> StoryWriterService:
    global _story_writer
    if _story_writer is None:
        _story_writer = StoryWriterService()
    return _story_writer


def _get_image_service() -> ImageService:
    global _image_service
    if _image_service is None:
        _image_service = ImageService()
    return _image_service


def _get_narration_service() -> NarrationService:
    global _narration_service
    if _narration_service is None:
        _narration_service = NarrationService()
    return _narration_service


def _get_safety() -> SafetyService:
    global _safety
    if _safety is None:
        _safety = SafetyService()
    return _safety


# ---------------------------------------------------------------------------
# ADK FunctionTools
# ---------------------------------------------------------------------------


async def generate_story_page(
    user_direction: str,
    tool_context: ToolContext,
) -> dict[str, Any]:
    """Generate the next page of the storybook based on the conversation.

    Call this when the user has given enough detail for the next page.
    The page will include story text and an illustration displayed on their screen.
    This tool returns immediately — the page is generated in the background.

    Args:
        user_direction: Clear summary of what the user wants on this page,
            including any characters, events, mood, or specific details.
    """
    from app.observability import metrics

    metrics.tool_calls_total.inc(labels={"tool": "generate_story_page"})

    # Retrieve story_state from ADK session state
    story_state: StoryState = tool_context.state.get("story_state")
    if story_state is None:
        metrics.errors.inc(labels={"tool": "generate_story_page"})
        return {"status": "error", "message": "No active story session."}

    page_number = story_state.current_page + 1

    # Log direction
    if user_direction:
        story_state.direction_log.append(
            Direction(
                page=page_number,
                type=DirectionType.STEERING,
                input=user_direction,
            )
        )

    # Capture immutable values for background task
    style_value = story_state.style.value
    age_setting = story_state.age_setting
    ss_key = story_state.session_id

    # Spawn heavy pipeline as background task (non-blocking)
    asyncio.create_task(
        _generate_page_background(
            story_state=story_state,
            page_number=page_number,
            user_direction=user_direction,
            style_value=style_value,
            age_setting=age_setting,
            queue_key=ss_key,
        )
    )

    # Return immediately so the Live API audio stream keeps flowing
    return {
        "status": "generating",
        "page_number": page_number,
        "message": (
            f"I'm creating page {page_number} now! "
            "The illustration and text will appear on your screen in a moment."
        ),
    }


# Per-session queue for pushing completed pages from background tasks to ws.py
_page_queues: dict[str, asyncio.Queue] = {}


def register_page_queue(story_state_id: str, queue: asyncio.Queue) -> None:
    """Register an asyncio.Queue for a story session. Called by ws.py."""
    _page_queues[story_state_id] = queue


def unregister_page_queue(story_state_id: str) -> None:
    """Unregister the queue when session ends."""
    _page_queues.pop(story_state_id, None)


async def _generate_page_background(
    story_state: StoryState,
    page_number: int,
    user_direction: str,
    style_value: str,
    age_setting: str,
    queue_key: str,
) -> None:
    """Background task: generates story TEXT only (no images during conversation).

    Images and narration are deferred until the story is complete to keep
    the Live API session responsive.
    """
    from app.observability import metrics, tracer
    from app.observability.trace import SpanStatus

    span = tracer.start_span(
        "generate_story_page_bg",
        attributes={"user_direction": user_direction[:200] if user_direction else ""},
    )
    _start = time.time()

    try:
        story_writer = _get_story_writer()
        safety = _get_safety()

        # Generate story text via StoryWriter (Gemini)
        writer_result = await story_writer.generate_page(
            story_state=story_state,
            page_number=page_number,
            user_direction=user_direction,
        )
        page_text = writer_result["text"]

        # Safety check
        if not safety.is_text_safe(page_text, age_setting):
            logger.warning("Page text failed safety check, regenerating...")
            metrics.safety_blocks.inc(labels={"stage": "first_pass"})
            writer_result = await story_writer.generate_page(
                story_state=story_state,
                page_number=page_number,
                user_direction=user_direction + " (keep content child-friendly and safe)",
            )
            page_text = writer_result["text"]
            if not safety.is_text_safe(page_text, age_setting):
                logger.error("Page text failed safety check after retry")
                metrics.safety_blocks.inc(labels={"stage": "second_pass"})
                tracer.end_span(span, SpanStatus.ERROR)
                return

        # Update story state (text only — images deferred to post-story)
        new_page = Page(
            number=page_number,
            text=page_text,
            summary=writer_result["summary"],
            scene_description=writer_result["scene_description"],
        )
        story_state.pages.append(new_page)

        # Auto-generate title from first page
        if page_number == 1 and not story_state.title:
            summary = writer_result.get("summary", "")
            story_state.title = summary[:60] if summary else (story_state.seed[:60] or "My Story")

        # Deduplicate characters
        existing_names = {c.name.lower().strip() for c in story_state.characters}
        for char_data in writer_result.get("new_characters", []):
            if isinstance(char_data, dict):
                name = char_data.get("name", "Unknown")
                if name.lower().strip() not in existing_names:
                    raw_traits = char_data.get("traits", []) or []
                    traits = raw_traits if isinstance(raw_traits, list) else [str(raw_traits)]
                    story_state.characters.append(
                        Character(
                            name=name,
                            traits=traits,
                            visual_description=char_data.get("visual_description", ""),
                            first_appearance_page=page_number,
                        )
                    )
                    existing_names.add(name.lower().strip())

        for rule in writer_result.get("world_rule_changes", []):
            if rule and rule not in story_state.world_rules:
                story_state.world_rules.append(rule)

        # Push completed page to the queue (text only, no images yet)
        page_data = {
            "page_number": page_number,
            "text": page_text,
            "summary": writer_result["summary"],
            "scene_description": writer_result.get("scene_description", ""),
        }

        queue = _page_queues.get(queue_key)
        if queue:
            await queue.put(page_data)
            logger.info("Page %d text pushed to queue in %.1fs", page_number, time.time() - _start)
        else:
            logger.warning("No page queue registered for key %s — page %d lost", queue_key, page_number)

        span.set_attribute("page_number", page_number)
        span.set_attribute("text_length", len(page_text))
        span.add_event("page_text_ready")
        tracer.end_span(span, SpanStatus.OK)
        metrics.pages_generated.inc()
        metrics.tool_duration.observe(time.time() - _start)
        metrics.page_text_length.observe(len(page_text))

    except Exception as e:
        logger.error("Background page generation failed: %s", e, exc_info=True)
        tracer.end_span(span, SpanStatus.ERROR)


async def finish_story(
    ending_direction: str,
    tool_context: ToolContext,
) -> dict[str, Any]:
    """Wrap up the story with a final page and prepare the book for PDF export.

    Call this when the user wants to end the story.

    Args:
        ending_direction: How the user wants the story to end,
            including any final events or resolution.
    """
    from app.observability import metrics, tracer
    from app.observability.trace import SpanStatus

    span = tracer.start_span(
        "finish_story",
        attributes={"ending_direction": ending_direction[:200] if ending_direction else ""},
    )
    metrics.tool_calls_total.inc(labels={"tool": "finish_story"})
    _start = time.time()

    story_state: StoryState = tool_context.state.get("story_state")
    if story_state is None:
        tracer.end_span(span, SpanStatus.ERROR)
        return {"status": "error", "message": "No active story session."}

    # Generate final page
    _result = await generate_story_page(
        user_direction=f"This is the FINAL page. Wrap up the story: {ending_direction}",
        tool_context=tool_context,
    )

    story_state.is_complete = True
    tool_context.state["story_complete"] = True

    span.set_attribute("total_pages", story_state.current_page)
    span.add_event("story_complete")
    tracer.end_span(span, SpanStatus.OK)
    metrics.tool_duration.observe(time.time() - _start)

    return {
        "status": "complete",
        "total_pages": story_state.current_page,
        "message": "The story is complete! The book is ready to download.",
    }


# ---------------------------------------------------------------------------
# Agent definition
# ---------------------------------------------------------------------------


def build_quill_agent(story_state: StoryState) -> Agent:
    """Build the Quill agent with the current story context baked into the prompt.

    Args:
        story_state: The active story session state.

    Returns:
        A configured ADK Agent.
    """
    story_context = story_state.get_live_summary()
    profile = story_state.age_profile

    # Keep instruction SHORT — every token counts in the Live API context window.
    instruction = f"""You are Quill, a playful story companion for kids.

RULES:
- Keep replies to 1-2 SHORT sentences. Be concise.
- Ask one fun question to guide the story, then LISTEN.
- Call generate_story_page when the user gives enough detail for a page. Summarize their idea in user_direction.
- Call finish_story when the user wants to end.
- Do NOT narrate your actions. Do NOT repeat what you just did.
- Keep the {profile["label"]} age group in mind.

STORY STATE:
{story_context}
"""

    return Agent(
        name="quill",
        model="gemini-2.5-flash-native-audio-latest",
        instruction=instruction,
        tools=[generate_story_page, finish_story],
    )

