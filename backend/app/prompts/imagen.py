"""Style-locked Imagen illustration prompt templates."""

from __future__ import annotations

# Style-specific positive prompt prefixes
STYLE_PROMPTS: dict[str, str] = {
    "watercolour": (
        "watercolor painting, soft washes, children's book illustration, "
        "warm colors, gentle strokes, dreamy atmosphere, hand-painted look, "
        "delicate details, storybook art style"
    ),
    "dreamy_pastel": (
        "dreamy pastel illustration, soft gradients, gentle color palette, "
        "magical atmosphere, cotton candy colors, ethereal glow, "
        "children's book art, kawaii aesthetic, rounded shapes"
    ),
    "pixel_art": (
        "pixel art illustration, retro game aesthetic, colorful sprites, "
        "clean pixel grid, 16-bit era style, vibrant colors, "
        "nostalgic gaming art, crisp edges"
    ),
}

# Style-specific negative prompts
STYLE_NEGATIVE_PROMPTS: dict[str, str] = {
    "watercolour": (
        "photorealistic, 3D render, digital art, sharp edges, "
        "neon colors, dark themes, scary imagery, violence"
    ),
    "dreamy_pastel": (
        "photorealistic, 3D render, harsh colors, sharp contrasts, "
        "dark themes, scary imagery, violence, gritty textures"
    ),
    "pixel_art": (
        "photorealistic, smooth gradients, watercolor, oil painting, "
        "dark themes, scary imagery, violence, blurry"
    ),
}

# Fallback for unknown styles
DEFAULT_PROMPT = (
    "children's book illustration, colorful, warm, friendly, "
    "safe for children, storybook art"
)
DEFAULT_NEGATIVE = (
    "photorealistic, scary, violent, dark, inappropriate, "
    "adult content, horror"
)


def build_imagen_prompt(scene_description: str, style: str) -> str:
    """Build a style-locked illustration prompt.

    Args:
        scene_description: Scene description from the story writer.
        style: Visual style key.

    Returns:
        Complete prompt for Imagen/Gemini image generation.
    """
    style_prefix = STYLE_PROMPTS.get(style, DEFAULT_PROMPT)
    return f"{style_prefix}. Scene: {scene_description}"


def get_negative_prompt(style: str) -> str:
    """Get the negative prompt for a style.

    Args:
        style: Visual style key.

    Returns:
        Negative prompt string.
    """
    return STYLE_NEGATIVE_PROMPTS.get(style, DEFAULT_NEGATIVE)
