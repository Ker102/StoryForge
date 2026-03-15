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

    Args:
        user_direction: Clear summary of what the user wants on this page,
            including any characters, events, mood, or specific details.
    """
    from app.observability import metrics, tracer
    from app.observability.trace import SpanStatus

    span = tracer.start_span(
        "generate_story_page",
        attributes={"user_direction": user_direction[:200] if user_direction else ""},
    )
    metrics.tool_calls_total.inc(labels={"tool": "generate_story_page"})
    _start = time.time()
    # Retrieve story_state from ADK session state
    story_state: StoryState = tool_context.state.get("story_state")
    if story_state is None:
        span.add_event("error", {"reason": "no_active_session"})
        tracer.end_span(span, SpanStatus.ERROR)
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

    story_writer = _get_story_writer()
    safety = _get_safety()

    # Step 1: Generate story text
    writer_result = await story_writer.generate_page(
        story_state=story_state,
        page_number=page_number,
        user_direction=user_direction,
    )
    page_text = writer_result["text"]

    # Safety check — regenerate if unsafe, abort if still fails
    if not safety.is_text_safe(page_text, story_state.age_setting):
        logger.warning("Page text failed safety check, regenerating...")
        metrics.safety_blocks.inc(labels={"stage": "first_pass"})
        span.add_event("safety_block", {"attempt": 1})
        writer_result = await story_writer.generate_page(
            story_state=story_state,
            page_number=page_number,
            user_direction=user_direction + " (keep content child-friendly and safe)",
        )
        page_text = writer_result["text"]
        if not safety.is_text_safe(page_text, story_state.age_setting):
            logger.error("Page text failed safety check after retry")
            metrics.safety_blocks.inc(labels={"stage": "second_pass"})
            span.add_event("safety_block_final", {"attempt": 2})
            tracer.end_span(span, SpanStatus.ERROR)
            return {
                "status": "error",
                "message": "Unable to generate safe content. Please try again.",
            }

    # Step 2: Generate illustration + narration in parallel
    image_base64, narration_base64 = await asyncio.gather(
        _get_image_service().generate_illustration(
            scene_description=writer_result["scene_description"],
            style=story_state.style.value,
        ),
        _get_narration_service().generate_narration(page_text),
        return_exceptions=True,
    )

    # Handle failures gracefully
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

    # Deduplicate characters by name
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

    # Update world rules
    for rule in writer_result.get("world_rule_changes", []):
        if rule and rule not in story_state.world_rules:
            story_state.world_rules.append(rule)

    # Store page data for the WebSocket layer to pick up
    tool_context.state["latest_page"] = {
        "page_number": page_number,
        "text": page_text,
        "summary": writer_result["summary"],
        "image_base64": image_base64,
        "narration_audio_base64": narration_base64,
    }

    # Record observability data
    span.set_attribute("page_number", page_number)
    span.set_attribute("text_length", len(page_text))
    span.set_attribute("has_image", image_base64 is not None)
    span.set_attribute("has_narration", narration_base64 is not None)
    span.add_event("page_ready")
    tracer.end_span(span, SpanStatus.OK)
    metrics.pages_generated.inc()
    metrics.tool_duration.observe(time.time() - _start)
    metrics.page_text_length.observe(len(page_text))

    return {
        "status": "success",
        "page_number": page_number,
        "summary": writer_result["summary"],
        "message": (
            f"Page {page_number} is ready! "
            f"The illustration shows {writer_result['scene_description'][:100]}."
        ),
    }


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

    instruction = f"""You are Quill, a warm, enthusiastic, and playful creative companion \
who helps children create their very own storybooks. You are like a fun art teacher \
who gets genuinely excited about every idea.

YOUR ROLE:
- You are a CONVERSATIONAL COMPANION, not a narrator. You do NOT read stories aloud.
- You talk WITH the user about their story ideas, ask engaging follow-up questions, \
and help them shape their creative vision.
- When the user has given you enough detail for a page, you call the \
generate_story_page tool to create it. The story text and illustrations are \
displayed visually on their screen — you don't need to read them.
- After a page is generated, react with enthusiasm ("Oh wow! Look at that! \
The illustration turned out amazing!") and ask what should happen next.

YOUR PERSONALITY:
- Warm and encouraging — every idea is a great idea
- Curious — ask "what if" questions to spark creativity
- Playful — use fun language appropriate for {profile["label"]}
- Gently guiding — help shape the story without dominating
- Brief — keep your responses short and conversational (2-3 sentences max)

CONVERSATION GUIDELINES:
- When the user first speaks, greet them warmly and ask about their story idea
- Ask clarifying questions: "What does your character look like?", \
"Is the forest magical or spooky?", "What happens when they meet?"
- Confirm before generating: "That sounds awesome! Let me make that page for you!"
- After generating, ask about the next page naturally
- If the user seems done, gently ask: "Should we wrap up the story, \
or is there more adventure to come?"
- Adapt your vocabulary to match the {profile["label"]} age group

TOOL USAGE:
- Call generate_story_page when the user has described enough for a new page
- In the user_direction field, summarize what the user wants clearly
- Call finish_story when the user wants to end the book
- Do NOT call tools speculatively — only when the user has given clear direction

CURRENT STORY STATE:
{story_context}
"""

    return Agent(
        name="quill",
        model="gemini-2.5-flash",
        instruction=instruction,
        tools=[generate_story_page, finish_story],
    )
