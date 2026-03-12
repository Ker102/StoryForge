"""Live Session Service — manages the Gemini Live API WebSocket session.

The Live agent acts as a CREATIVE COMPANION:
- Talks to the user conversationally (voice)
- Asks follow-up questions about their story
- Decides when to trigger page generation via tool calls
- Does NOT narrate the story (that's the narration service)
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings
from app.models.story import StoryState
from app.prompts.live_agent import build_live_system_prompt, build_tool_declarations

logger = logging.getLogger(__name__)


class LiveSessionService:
    """Manages the bidirectional Gemini Live API session."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = settings.live_model
        self._session = None
        self._receive_task: asyncio.Task | None = None

    async def connect(
        self,
        story_state: StoryState,
        on_agent_audio: Callable[[bytes], Awaitable[None]],
        on_agent_text: Callable[[str], Awaitable[None]],
        on_tool_call: Callable[[str, dict[str, Any]], Awaitable[dict[str, Any]]],
    ) -> None:
        """Connect to the Gemini Live API.

        Args:
            story_state: Current story state for system prompt context.
            on_agent_audio: Callback for agent audio chunks (conversation).
            on_agent_text: Callback for agent text responses.
            on_tool_call: Callback for tool calls (returns tool response).
        """
        system_prompt = build_live_system_prompt(story_state)
        tools = build_tool_declarations()

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=system_prompt,
            tools=tools,
        )

        logger.info("Connecting to Live API with model=%s", self.model)

        self._session = await self.client.aio.live.connect(
            model=self.model,
            config=config,
        ).__aenter__()

        logger.info("Live API session connected")

        # Start receive loop
        self._receive_task = asyncio.create_task(
            self._receive_loop(on_agent_audio, on_agent_text, on_tool_call)
        )

    async def send_audio(self, audio_bytes: bytes) -> None:
        """Forward user mic audio to the Live API."""
        if self._session is None:
            logger.warning("Attempted to send audio without active session")
            return

        await self._session.send_realtime_input(
            audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
        )

    async def send_text(self, text: str) -> None:
        """Send text input to the Live API (secondary feature)."""
        if self._session is None:
            logger.warning("Attempted to send text without active session")
            return

        await self._session.send_client_content(
            turns=types.Content(
                role="user",
                parts=[types.Part(text=text)],
            ),
            turn_complete=True,
        )

    async def update_context(self, story_state: StoryState) -> None:
        """Inject updated story summary into the Live session.

        Called after a new page is generated to keep the agent informed
        without bloating its context with full story text.
        """
        if self._session is None:
            logger.warning("Attempted update_context with no active session")
            return

        summary = story_state.get_live_summary()
        await self._session.send_client_content(
            turns=types.Content(
                role="user",
                parts=[types.Part(text=f"[SYSTEM UPDATE] Current story state:\n{summary}")],
            ),
            turn_complete=True,
        )

    async def disconnect(self) -> None:
        """Close the Live API session."""
        if self._receive_task:
            self._receive_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._receive_task
            self._receive_task = None

        if self._session:
            try:
                await self._session.__aexit__(None, None, None)
            except Exception as e:
                logger.error("Error closing Live session: %s", e)
            finally:
                self._session = None

        logger.info("Live API session disconnected")

    async def _receive_loop(
        self,
        on_agent_audio: Callable[[bytes], Awaitable[None]],
        on_agent_text: Callable[[str], Awaitable[None]],
        on_tool_call: Callable[[str, dict[str, Any]], Awaitable[dict[str, Any]]],
    ) -> None:
        """Continuously receive responses from the Live API."""
        try:
            while self._session:
                turn = self._session.receive()
                async for response in turn:
                    # Handle tool calls
                    if response.tool_call:
                        for fc in response.tool_call.function_calls:
                            logger.info("Tool call: %s(%s)", fc.name, fc.args)
                            result = await on_tool_call(fc.name, fc.args or {})

                            # Send tool response back to Live API
                            await self._session.send_tool_response(
                                function_responses=types.FunctionResponse(
                                    name=fc.name,
                                    response=result,
                                    id=fc.id,
                                )
                            )

                    # Handle model audio output (agent conversation)
                    if response.server_content and response.server_content.model_turn:
                        for part in response.server_content.model_turn.parts:
                            if part.inline_data and isinstance(part.inline_data.data, bytes):
                                await on_agent_audio(part.inline_data.data)
                            elif part.text:
                                await on_agent_text(part.text)

        except asyncio.CancelledError:
            logger.info("Receive loop cancelled")
        except Exception as e:
            logger.error("Receive loop error: %s", e, exc_info=True)
