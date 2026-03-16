"""WebSocket route — the main story session endpoint.

Bridges the frontend ↔ ADK Agent (Quill) ↔ Story pipeline.
Uses ADK's InMemoryRunner for agent execution and session management.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import contextlib
import json
import logging
import traceback as tb_module

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode, ToolThreadPoolConfig
from google.adk.events import Event, EventActions  # noqa: F401 (used by finish_story state check)
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agents.quill import build_quill_agent, register_page_queue, unregister_page_queue
from app.middleware.auth import verify_firebase_token
from app.models.session import (
    AgentTextMessage,
    PageUpdateMessage,
    StatusMessage,
    WSMessageType,
)
from app.services import firestore_service
from app.state.manager import state_manager

logger = logging.getLogger(__name__)
router = APIRouter()

AUDIO_MIME_TYPE = "audio/pcm;rate=16000"

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

    # Track active connections
    from app.observability import metrics as obs_metrics
    from app.observability import tracer as obs_tracer
    from app.observability.trace import SpanStatus

    obs_metrics.active_websockets.inc()

    session_id = None
    adk_session = None
    agent_task = None
    user_id = None  # Firebase UID (None = anonymous)
    send_lock = asyncio.Lock()
    # Audio gate: drop incoming mic audio while a tool call is in progress
    # to avoid the Live API 1008 race condition.
    audio_gate_open = True

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

        # Verify auth token (optional — anonymous sessions allowed)
        auth_token = init_data.get("token")
        user_info = await verify_firebase_token(auth_token)
        if user_info:
            user_id = user_info["uid"]

        await safe_send(
            StatusMessage(
                type=WSMessageType.SESSION_READY,
                session_id=session_id,
                message="Session created. Connecting to your creative companion...",
            ).model_dump()
        )

        # --- Build ADK Agent and Runner ---
        quill_agent = build_quill_agent(story_state)
        runner = Runner(
            agent=quill_agent,
            app_name="storyforge",
            session_service=_session_service,
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

        live_queue = LiveRequestQueue()

        # RunConfig for native-audio model: BIDI streaming with audio responses
        # context_window_compression: auto-trim old context when token budget fills
        # NOTE: session_resumption and tool_thread_pool_config removed —
        #       they caused the native-audio model to stop processing audio input.
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=["AUDIO"],
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            context_window_compression=types.ContextWindowCompressionConfig(
                trigger_tokens=120_000,
                sliding_window=types.SlidingWindow(target_tokens=60_000),
            ),
            save_input_blobs_as_artifacts=False,
            save_live_audio=False,
        )

        async def run_agent_loop():
            """Background task: runs the live bidi-streaming agent loop.

            Wraps run_live in a retry loop — the Live API may disconnect with
            a 1008 error when audio races with tool execution. On error we
            recreate the LiveRequestQueue and restart.
            """
            nonlocal audio_gate_open, live_queue
            max_retries = 5
            retry_count = 0

            while retry_count < max_retries:
                try:
                    async for event in runner.run_live(
                        user_id=session_id,
                        session_id=adk_session.id,
                        live_request_queue=live_queue,
                        run_config=run_config,
                    ):
                        # Reset retry count on successful events
                        retry_count = 0

                        # Detect tool call events to gate audio input
                        if event.content and event.content.parts:
                            has_function_call = any(
                                getattr(part, "function_call", None) is not None
                                for part in event.content.parts
                            )
                            has_function_response = any(
                                getattr(part, "function_response", None) is not None
                                for part in event.content.parts
                            )
                            if has_function_call:
                                audio_gate_open = False
                                logger.info("Audio gate CLOSED (tool call in progress)")
                            if has_function_response:
                                audio_gate_open = True
                                logger.info("Audio gate OPEN (tool call complete)")

                        # Forward audio + text from agent response
                        if event.content and event.content.parts:
                            for part in event.content.parts:
                                # Audio data — forward immediately
                                if getattr(part, "inline_data", None) and getattr(part.inline_data, "data", None):
                                    # Re-open gate when agent starts speaking again
                                    if not audio_gate_open:
                                        audio_gate_open = True
                                        logger.info("Audio gate OPEN (agent audio resumed)")
                                    async with send_lock:
                                        await websocket.send_bytes(part.inline_data.data)
                                # Text responses (transcriptions or text-only)
                                elif getattr(part, "text", None):
                                    await safe_send(
                                        AgentTextMessage(
                                            session_id=session_id,
                                            text=part.text,
                                        ).model_dump()
                                    )

                    # run_live ended normally (session completed)
                    logger.info("Agent live loop ended normally")
                    break

                except Exception as e:
                    retry_count += 1
                    error_str = str(e)
                    is_1008 = "1008" in error_str

                    if is_1008 and retry_count < max_retries:
                        logger.warning(
                            "1008 error (audio/tool race) — retrying (%d/%d): %s",
                            retry_count, max_retries, e,
                        )
                        # Re-open audio gate and create fresh queue
                        audio_gate_open = True
                        live_queue = LiveRequestQueue()
                        await asyncio.sleep(1)  # brief pause before retry
                        continue
                    else:
                        tb_str = tb_module.format_exc()
                        logger.error("Agent live loop error: %s\n%s", e, tb_str)
                        await safe_send(
                            StatusMessage(
                                session_id=session_id,
                                type=WSMessageType.ERROR,
                                message=f"Quill error: {type(e).__name__}: {e}",
                            ).model_dump()
                        )
                        break

        agent_task = asyncio.create_task(run_agent_loop())

        # Background task: consume completed pages from the async queue
        story_state_key = session_id  # Must match key used in quill.py
        page_queue: asyncio.Queue = asyncio.Queue()
        register_page_queue(story_state_key, page_queue)

        async def consume_page_queue():
            """Await completed pages from background generation tasks."""
            while True:
                page_data = await page_queue.get()  # blocks until a page is ready
                page_num = page_data["page_number"]
                has_img = page_data.get("image_base64") is not None
                logger.info(
                    "Page %d received from queue (has_image=%s, text_len=%d) — sending to frontend",
                    page_num, has_img, len(page_data.get("text", "")),
                )
                msg = PageUpdateMessage(
                    session_id=session_id,
                    page_number=page_num,
                    text=page_data["text"],
                    summary=page_data["summary"],
                    image_base64=page_data.get("image_base64"),
                    narration_audio_base64=page_data.get("narration_audio_base64"),
                ).model_dump()
                await safe_send(msg)
                logger.info("Page %d sent to frontend via WebSocket", page_num)
                # Persist to Firestore
                if user_id:
                    try:
                        await firestore_service.save_story(user_id, story_state)
                    except Exception as save_err:
                        logger.warning("Firestore save failed: %s", save_err)

        page_poll_task = asyncio.create_task(consume_page_queue())

        # --- Message receive + agent input loop ---
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
                    # Send text to agent via ADK live queue
                    user_text = data.get("text", "")
                    if user_text:
                        live_queue.send_content(types.Content(
                            role="user",
                            parts=[types.Part(text=user_text)],
                        ))

                elif msg_type == WSMessageType.AUDIO_CHUNK:
                    # Audio payload as base64 (legacy fallback)
                    if not audio_gate_open:
                        continue  # drop audio during tool calls
                    audio_b64 = data.get("audio_base64", "")
                    if audio_b64:
                        try:
                            _audio_bytes = base64.b64decode(audio_b64)
                            live_queue.send_realtime(
                                types.Blob(mime_type=AUDIO_MIME_TYPE, data=_audio_bytes)
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
                # Send raw binary PCM audio directly to Gemini Live API
                # BUT only if the audio gate is open (not during tool calls)
                if audio_gate_open:
                    live_queue.send_realtime(
                        types.Blob(mime_type=AUDIO_MIME_TYPE, data=message["bytes"])
                    )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected (session=%s)", session_id)
    except Exception as e:
        logger.error("WebSocket error: %s", e, exc_info=True)
        with contextlib.suppress(Exception):
            await safe_send(
                StatusMessage(
                    type=WSMessageType.ERROR,
                    session_id=session_id,
                    message="Internal server error",
                ).model_dump()
            )
    finally:
        if "page_poll_task" in locals() and page_poll_task:
            page_poll_task.cancel()
        if "agent_task" in locals() and agent_task:
            agent_task.cancel()
        # Unregister the page queue
        if "story_state_key" in locals():
            unregister_page_queue(story_state_key)
        obs_metrics.active_websockets.dec()
        if session_id:
            logger.info("Cleaning up session %s", session_id)
            if adk_session is not None:
                try:
                    await _session_service.delete_session(
                        app_name="storyforge",
                        user_id=session_id,
                        session_id=adk_session.id,
                    )
                except Exception as cleanup_err:
                    logger.warning("Session cleanup failed: %s", cleanup_err)
