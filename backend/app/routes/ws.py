"""WebSocket route — the main story session endpoint.

Bridges the frontend ↔ Live API ↔ Orchestrator pipeline.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.session import (
    AgentAudioMessage,
    AgentTextMessage,
    PageUpdateMessage,
    StatusMessage,
    WSMessageType,
)
from app.models.story import Page
from app.services.live_session import LiveSessionService
from app.services.orchestrator import Orchestrator
from app.state.manager import state_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/story")
async def story_websocket(websocket: WebSocket):
    """Main WebSocket endpoint for story sessions.

    Protocol:
    1. Client sends INIT message with style, age_setting, seed
    2. Server creates session and connects to Live API
    3. Bidirectional streaming: audio/text in ↔ pages/audio out
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    session_id = None
    live_service = None
    send_lock = asyncio.Lock()

    try:
        # --- Wait for INIT message ---
        try:
            init_data = await websocket.receive_json()
        except json.JSONDecodeError:
            await websocket.send_json(
                StatusMessage(
                    type=WSMessageType.ERROR,
                    message="Malformed JSON in init message",
                ).model_dump()
            )
            await websocket.close()
            return

        if init_data.get("type") != WSMessageType.INIT:
            await websocket.send_json(
                StatusMessage(
                    type=WSMessageType.ERROR,
                    message="First message must be type 'init'",
                ).model_dump()
            )
            await websocket.close()
            return

        # Create session
        story_state = state_manager.create_session(
            style=init_data.get("style", "watercolour"),
            age_setting=init_data.get("age_setting", "children_5_8"),
            seed=init_data.get("seed", ""),
        )
        session_id = story_state.session_id

        # Send session ready confirmation
        await websocket.send_json(
            StatusMessage(
                type=WSMessageType.SESSION_READY,
                session_id=session_id,
                message="Session created. Connecting to your creative companion...",
            ).model_dump()
        )

        # --- Set up services ---
        live_service = LiveSessionService()
        orchestrator = Orchestrator()

        # Callback: send agent audio to frontend
        async def on_agent_audio(audio_bytes: bytes) -> None:
            async with send_lock:
                await websocket.send_json(
                    AgentAudioMessage(
                        session_id=session_id,
                        audio_base64=base64.b64encode(audio_bytes).decode("utf-8"),
                    ).model_dump()
                )

        # Callback: send agent text to frontend
        async def on_agent_text(text: str) -> None:
            async with send_lock:
                await websocket.send_json(
                    AgentTextMessage(
                        session_id=session_id,
                        text=text,
                    ).model_dump()
                )

        # Callback: handle tool calls from Live API
        async def on_tool_call(name: str, args: dict) -> dict:
            # Send status update to frontend
            async with send_lock:
                await websocket.send_json(
                    StatusMessage(
                        session_id=session_id,
                        message=f"Creating page {args.get('page_number', '...')}...",
                    ).model_dump()
                )

            # Delegate to orchestrator
            return await orchestrator.handle_tool_call(
                tool_name=name,
                tool_args=args,
                story_state=story_state,
                on_page_ready=on_page_ready,
            )

        # Callback: send completed page to frontend
        async def on_page_ready(page: Page) -> None:
            async with send_lock:
                await websocket.send_json(
                    PageUpdateMessage(
                        session_id=session_id,
                        page_number=page.number,
                        text=page.text,
                        summary=page.summary,
                        image_base64=page.image_base64,
                        narration_audio_base64=page.narration_audio_base64,
                    ).model_dump()
                )

            # Update Live API context with new story state
            await live_service.update_context(story_state)

        # --- Connect to Live API (with timeout) ---
        try:
            await asyncio.wait_for(
                live_service.connect(
                    story_state=story_state,
                    on_agent_audio=on_agent_audio,
                    on_agent_text=on_agent_text,
                    on_tool_call=on_tool_call,
                ),
                timeout=30.0,
            )
        except asyncio.TimeoutError:
            async with send_lock:
                await websocket.send_json(
                    StatusMessage(
                        type=WSMessageType.ERROR,
                        session_id=session_id,
                        message="Connection to creative companion timed out. Please try again.",
                    ).model_dump()
                )
            await websocket.close()
            return

        await websocket.send_json(
            StatusMessage(
                session_id=session_id,
                message="Your creative companion Quill is ready! Start talking!",
            ).model_dump()
        )

        # --- Message receive loop ---
        while True:
            message = await websocket.receive()

            if "text" in message:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    async with send_lock:
                        await websocket.send_json(
                            StatusMessage(
                                session_id=session_id,
                                type=WSMessageType.ERROR,
                                message="Invalid JSON message",
                            ).model_dump()
                        )
                    continue

                msg_type = data.get("type")

                if msg_type == WSMessageType.AUDIO_CHUNK:
                    # Decode and forward audio to Live API
                    audio_b64 = data.get("audio_base64", "")
                    if audio_b64:
                        try:
                            audio_bytes = base64.b64decode(audio_b64)
                            await live_service.send_audio(audio_bytes)
                        except binascii.Error:
                            logger.warning("Invalid base64 audio data")

                elif msg_type == WSMessageType.TEXT_INPUT:
                    # Send text to Live API (secondary feature)
                    text = data.get("text", "")
                    if text:
                        await live_service.send_text(text)

                elif msg_type == WSMessageType.EXPORT_REQUEST:
                    # Handled via REST endpoint
                    async with send_lock:
                        await websocket.send_json(
                            StatusMessage(
                                session_id=session_id,
                                message="Use GET /export/pdf/{session_id} to download.",
                            ).model_dump()
                        )

            elif "bytes" in message:
                # Raw binary audio — forward directly
                await live_service.send_audio(message["bytes"])

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected (session=%s)", session_id)
    except Exception as e:
        logger.error("WebSocket error: %s", e, exc_info=True)
        try:
            async with send_lock:
                await websocket.send_json(
                    StatusMessage(
                        type=WSMessageType.ERROR,
                        session_id=session_id,
                        message="Internal server error",
                    ).model_dump()
                )
        except Exception:
            pass
    finally:
        # Cleanup
        if live_service:
            await live_service.disconnect()
        if session_id:
            logger.info("Cleaning up session %s", session_id)
