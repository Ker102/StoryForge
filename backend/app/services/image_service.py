"""Image Generation Service — calls Imagen API with style-locked prompts.

Falls back to Gemini native image generation if Imagen is unavailable.
"""

from __future__ import annotations

import base64
import logging

from google import genai
from google.genai import types

from app.config import get_settings
from app.prompts.imagen import build_imagen_prompt, get_negative_prompt

logger = logging.getLogger(__name__)


class ImageService:
    """Generates story illustrations using Imagen or Gemini image models."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.image_model = settings.image_model
        self.fallback_model = settings.fallback_image_model

    async def generate_illustration(
        self,
        scene_description: str,
        style: str,
    ) -> str | None:
        """Generate an illustration for a story page.

        Args:
            scene_description: Visual scene description from the story writer.
            style: Visual style (watercolour, dreamy_pastel, pixel_art).

        Returns:
            Base64-encoded image string, or None if generation fails.
        """
        prompt = build_imagen_prompt(scene_description, style)
        negative = get_negative_prompt(style)

        logger.info("Generating illustration: style=%s, prompt=%s...", style, prompt[:80])

        # Try Imagen first
        try:
            return await self._generate_with_imagen(prompt, negative)
        except Exception as e:
            logger.warning("Imagen failed (%s), falling back to Gemini image", e)

        # Fallback to Gemini native image generation
        try:
            return await self._generate_with_gemini(prompt)
        except Exception as e:
            logger.error("Gemini image generation also failed: %s", e)
            return None

    async def _generate_with_imagen(
        self, prompt: str, negative_prompt: str
    ) -> str:
        """Generate using Imagen API."""
        response = await self.client.aio.models.generate_images(
            model=self.image_model,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/png",
                negative_prompt=negative_prompt,
                aspect_ratio="16:9",
                include_rai_reason=True,
            ),
        )

        if not response.generated_images:
            rai_reason = getattr(response, "rai_reason", "unknown")
            raise RuntimeError(f"Imagen returned no images (RAI: {rai_reason})")

        image_bytes = response.generated_images[0].image.image_bytes
        return base64.b64encode(image_bytes).decode("utf-8")

    async def _generate_with_gemini(self, prompt: str) -> str:
        """Fallback: generate using Gemini native image generation."""
        response = await self.client.aio.models.generate_content(
            model=self.fallback_model,
            contents=f"Generate a children's book illustration: {prompt}",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )

        for part in response.parts:
            if part.inline_data and part.inline_data.data:
                return base64.b64encode(part.inline_data.data).decode("utf-8")

        raise RuntimeError("Gemini image model returned no image data")
