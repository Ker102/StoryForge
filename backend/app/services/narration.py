"""Narration Service — TTS for reading story pages aloud.

Distinct from the Live agent's conversational voice. The narration voice
sounds like a storybook narrator (warm, expressive).
"""

from __future__ import annotations

import base64
import logging

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)


class NarrationService:
    """Generates story narration audio using Gemini TTS."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = settings.narration_model

    async def generate_narration(self, text: str) -> str | None:
        """Generate narration audio for a story page.

        Args:
            text: The story page text to narrate.

        Returns:
            Base64-encoded audio string, or None if generation fails.
        """
        logger.info("Generating narration for %d chars of text", len(text))

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=f"Read the following story page aloud in a warm, "
                         f"expressive storybook narrator voice. Read it slowly "
                         f"and clearly for children:\n\n{text}",
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Aoede"  # warm, expressive voice
                            )
                        )
                    ),
                ),
            )

            # Extract audio data from response
            for part in response.parts:
                if part.inline_data and part.inline_data.data:
                    audio_bytes = part.inline_data.data
                    if isinstance(audio_bytes, bytes):
                        return base64.b64encode(audio_bytes).decode("utf-8")

            logger.warning("TTS response contained no audio data")
            return None

        except Exception as e:
            logger.error("Narration generation failed: %s", e)
            return None
