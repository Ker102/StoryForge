"""Child-safe content filtering layer."""

from __future__ import annotations

import logging
import re

from app.models.story import AgeSetting

logger = logging.getLogger(__name__)

# Words/themes that should never appear in children's content
BLOCKED_THEMES = [
    "violence", "blood", "death", "kill", "murder", "weapon",
    "sexual", "drugs", "alcohol", "horror", "gore", "torture",
    "abuse", "suicide", "self-harm",
]

# Additional words allowed for teen content but not children
CHILDREN_BLOCKED = [
    "war", "battle", "fight", "scary", "nightmare", "demon",
]


class SafetyService:
    """Validates generated content for age-appropriateness."""

    def is_text_safe(self, text: str, age_setting: AgeSetting) -> bool:
        """Check if story text is safe for the target age group.

        Args:
            text: The story text to validate.
            age_setting: The age group setting.

        Returns:
            True if the text passes safety checks.
        """
        text_lower = text.lower()

        # Check universal blocked themes (word-boundary match)
        for theme in BLOCKED_THEMES:
            if re.search(r'\b' + re.escape(theme) + r'\b', text_lower):
                logger.warning("Blocked theme found in text: %s", theme)
                return False

        # Additional restrictions for younger children
        if age_setting == AgeSetting.CHILDREN_5_8:
            for word in CHILDREN_BLOCKED:
                if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                    logger.warning(
                        "Children-blocked word found: %s", word
                    )
                    return False

        return True

    def validate_imagen_prompt(self, prompt: str) -> str:
        """Sanitize an Imagen prompt to prevent unsafe image generation.

        Args:
            prompt: The raw illustration prompt.

        Returns:
            Sanitized prompt with safety additions.
        """
        # Add safety constraints
        safety_suffix = (
            " Safe for children, no violence, no scary imagery, "
            "no inappropriate content, family-friendly illustration."
        )
        return prompt + safety_suffix
