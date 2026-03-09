"""WebSocket session message types for frontend ↔ backend communication."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class WSMessageType(str, Enum):
    """WebSocket message type discriminator."""

    # Client → Server
    INIT = "init"                    # Initial session config
    AUDIO_CHUNK = "audio_chunk"      # Mic audio from client
    TEXT_INPUT = "text_input"        # Text input (secondary feature)
    NEXT_PAGE = "next_page"          # Manual next page request
    EXPORT_REQUEST = "export"        # Request PDF export

    # Server → Client
    PAGE_UPDATE = "page_update"      # New page: text + image + narration audio
    AGENT_AUDIO = "agent_audio"      # Live agent conversational audio
    AGENT_TEXT = "agent_text"        # Live agent text (transcript/fallback)
    STATUS = "status"                # Status updates (generating, error, etc.)
    EXPORT_READY = "export_ready"    # PDF is ready for download
    SESSION_READY = "session_ready"  # Session initialized successfully
    ERROR = "error"                  # Error message


class WSMessage(BaseModel):
    """Base WebSocket message."""
    type: WSMessageType
    session_id: Optional[str] = None


class StoryInitMessage(WSMessage):
    """Client sends this to start a new story session."""
    type: WSMessageType = WSMessageType.INIT
    style: str = "watercolour"       # VisualStyle value
    age_setting: str = "children_5_8"  # AgeSetting value
    seed: str = ""                   # Optional initial seed (voice is primary)


class AudioChunkMessage(WSMessage):
    """Client sends mic audio chunks."""
    type: WSMessageType = WSMessageType.AUDIO_CHUNK
    audio_base64: str = ""           # Base64-encoded PCM audio


class TextInputMessage(WSMessage):
    """Client sends text input (secondary feature)."""
    type: WSMessageType = WSMessageType.TEXT_INPUT
    text: str = ""


class PageUpdateMessage(WSMessage):
    """Server sends a new story page to the client."""
    type: WSMessageType = WSMessageType.PAGE_UPDATE
    page_number: int = 0
    text: str = ""
    summary: str = ""
    image_base64: Optional[str] = None
    narration_audio_base64: Optional[str] = None


class AgentAudioMessage(WSMessage):
    """Server sends Live agent conversational audio."""
    type: WSMessageType = WSMessageType.AGENT_AUDIO
    audio_base64: str = ""           # Base64-encoded audio response


class AgentTextMessage(WSMessage):
    """Server sends Live agent text (transcript/fallback)."""
    type: WSMessageType = WSMessageType.AGENT_TEXT
    text: str = ""


class StatusMessage(WSMessage):
    """Server sends status updates."""
    type: WSMessageType = WSMessageType.STATUS
    message: str = ""
    detail: Optional[str] = None


class ExportReadyMessage(WSMessage):
    """Server notifies client that PDF export is ready."""
    type: WSMessageType = WSMessageType.EXPORT_READY
    download_url: str = ""
