"""WebSocket route — the main story session endpoint.

Bridges the frontend ↔ ADK Agent (Quill) ↔ Story pipeline.
Uses ADK's InMemoryRunner for agent execution and session management.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.adk.runners import InMemoryRunner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agents.quill import build_quill_agent
from app.models.session import (
    AgentTextMessage,
    PageUpdateMessage,
    StatusMessage,
    WSMessageType,
)
from app.state.manager import state_manager

logger = logging.getLogger(__name__)
router = APIRouter()

# Shared session service (persists across WebSocket connections)
_session_service = InMemorySessionService()


@router.websocket("/ws/story")
async def story_websocket(websocket: WebSocket):
    """Main WebSocket endpoint for story sessions.

    Protocol:
    1. Client sends INIT message with style, age_setting, seed
    2. Server creates session and connects Quill (ADK Agent)
    3. Bidirectional streaming: audio/text in ↔ pages/audio out
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    session_id = None
    send_lock = asyncio.Lock()

    async def safe_send(msg: dict) -> None:
        """Send a JSON message with lock to prevent interleaving."""
        async with send_lock:
            await websocket.send_json(msg)

    try:
        # --- Wait for INIT message ---
        try:
            init_data = await websocket.receive_json()
        except json.JSONDecodeError:
            await safe_send(
                StatusMessage(
                    type=WSMessageType.ERROR,
                    message="Malformed JSON in init message",
                ).model_dump()
            )
            await websocket.close()
            return

        if init_data.get("type") != WSMessageType.INIT:
            await safe_send(
                StatusMessage(
                    type=WSMessageType.ERROR,
                    message="First message must be type 'init'",
                ).model_dump()
            )
            await websocket.close()
            return

        # Create story state
        story_state = state_manager.create_session(
            style=init_data.get("style", "watercolour"),
            age_setting=init_data.get("age_setting", "children_5_8"),
            seed=init_data.get("seed", ""),
        )
        session_id = story_state.session_id

        await safe_send(
            StatusMessage(
                type=WSMessageType.SESSION_READY,
                session_id=session_id,
                message="Session created. Connecting to your creative companion...",
            ).model_dump()
        )

        # --- Build ADK Agent and Runner ---
        quill_agent = build_quill_agent(story_state)
        runner = InMemoryRunner(
            agent=quill_agent,
            app_name="storyforge",
        )

        # Create ADK session with story_state in state dict
        adk_session = await _session_service.create_session(
            app_name="storyforge",
            user_id=session_id,
            state={"story_state": story_state},
        )

        await safe_send(
            StatusMessage(
                session_id=session_id,
                message="Your creative companion Quill is ready! Start talking!",
            ).model_dump()
        )

        # --- Message receive + agent run loop ---
        while True:
            message = await websocket.receive()

            if "text" in message:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    await safe_send(
                        StatusMessage(
                            session_id=session_id,
                            type=WSMessageType.ERROR,
                            message="Invalid JSON message",
                        ).model_dump()
                    )
                    continue

                msg_type = data.get("type")

                if msg_type == WSMessageType.TEXT_INPUT:
                    # Send text to agent via ADK runner
                    user_text = data.get("text", "")
                    if not user_text:
                        continue

                    async for event in runner.run_async(
                        user_id=session_id,
                        session_id=adk_session.id,
                        new_message=types.UserContent(
                            parts=[types.Part(text=user_text)]
                        ),
                    ):
                        # Forward agent text responses
                        if event.content and event.content.parts:
                            for part in event.content.parts:
                                if part.text:
                                    await safe_send(
                                        AgentTextMessage(
                                            session_id=session_id,
                                            text=part.text,
                                        ).model_dump()
                                    )

                        # Check if a page was generated (tool produced output)
                        current_session = await _session_service.get_session(
                            app_name="storyforge",
                            user_id=session_id,
                            session_id=adk_session.id,
                        )
                        latest_page = current_session.state.get("latest_page")
                        if latest_page:
                            await safe_send(
                                PageUpdateMessage(
                                    session_id=session_id,
                                    page_number=latest_page["page_number"],
                                    text=latest_page["text"],
                                    summary=latest_page["summary"],
                                    image_base64=latest_page.get("image_base64"),
                                    narration_audio_base64=latest_page.get(
                                        "narration_audio_base64"
                                    ),
                                ).model_dump()
                            )
                            # Clear so we don't re-send
                            current_session.state["latest_page"] = None

                        # Check for story completion
                        if current_session.state.get("story_complete"):
                            await safe_send(
                                StatusMessage(
                                    session_id=session_id,
                                    message="Your story is complete! Download it from the export page.",
                                ).model_dump()
                            )

                elif msg_type == WSMessageType.AUDIO_CHUNK:
                    # Audio input — decode and forward to agent
                    # Note: For full voice streaming, use runner.run_live()
                    # For now, log that audio was received
                    audio_b64 = data.get("audio_base64", "")
                    if audio_b64:
                        try:
                            _audio_bytes = base64.b64decode(audio_b64)
                            # TODO: Integrate with runner.run_live() for
                            # real-time audio bidi-streaming when ADK Live
                            # API stabilizes. For now, voice goes via text
                            # transcription on the frontend side.
                            logger.debug(
                                "Received audio chunk (%d bytes) — "
                                "audio streaming via ADK run_live planned",
                                len(_audio_bytes),
                            )
                        except binascii.Error:
                            logger.warning("Invalid base64 audio data")

                elif msg_type == WSMessageType.EXPORT_REQUEST:
                    await safe_send(
                        StatusMessage(
                            session_id=session_id,
                            message="Use GET /export/pdf/{session_id} to download.",
                        ).model_dump()
                    )

            elif "bytes" in message:
                # Raw binary audio — log for now
                logger.debug(
                    "Received raw audio (%d bytes) — "
                    "ADK run_live integration planned",
                    len(message["bytes"]),
                )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected (session=%s)", session_id)
    except Exception as e:
        logger.error("WebSocket error: %s", e, exc_info=True)
        try:
            await safe_send(
                StatusMessage(
                    type=WSMessageType.ERROR,
                    session_id=session_id,
                    message="Internal server error",
                ).model_dump()
            )
        except Exception:
            pass
    finally:
        if session_id:
            logger.info("Cleaning up session %s", session_id)
