"""Tests for the SafetyService content filtering."""

from __future__ import annotations

import pytest
from app.models.story import AgeSetting
from app.services.safety import BLOCKED_THEMES, CHILDREN_BLOCKED, SafetyService


@pytest.fixture
def safety() -> SafetyService:
    return SafetyService()


class TestBlockedThemes:
    """Universal blocked themes should be caught for ALL age groups."""

    @pytest.mark.parametrize("theme", BLOCKED_THEMES)
    def test_blocked_theme_children(self, safety: SafetyService, theme: str) -> None:
        text = f"The hero faced {theme} in the story."
        assert safety.is_text_safe(text, AgeSetting.CHILDREN_5_8) is False

    @pytest.mark.parametrize("theme", BLOCKED_THEMES)
    def test_blocked_theme_teen(self, safety: SafetyService, theme: str) -> None:
        text = f"The story involved {theme}."
        assert safety.is_text_safe(text, AgeSetting.TEEN_13_17) is False

    def test_safe_text_passes(self, safety: SafetyService) -> None:
        text = "The bunny hopped happily through the meadow."
        assert safety.is_text_safe(text, AgeSetting.CHILDREN_5_8) is True

    def test_case_insensitive(self, safety: SafetyService) -> None:
        text = "There was VIOLENCE in the room."
        assert safety.is_text_safe(text, AgeSetting.CHILDREN_5_8) is False


class TestChildrenBlocked:
    """Words blocked only for children_5_8, but allowed for teens."""

    @pytest.mark.parametrize("word", CHILDREN_BLOCKED)
    def test_blocked_for_children(self, safety: SafetyService, word: str) -> None:
        text = f"The story had a {word}."
        assert safety.is_text_safe(text, AgeSetting.CHILDREN_5_8) is False

    @pytest.mark.parametrize("word", CHILDREN_BLOCKED)
    def test_allowed_for_teens(self, safety: SafetyService, word: str) -> None:
        text = f"The story had a {word}."
        assert safety.is_text_safe(text, AgeSetting.TEEN_13_17) is True


class TestWordBoundary:
    """Ensure word-boundary matching doesn't over-match."""

    def test_no_false_positive_substring(self, safety: SafetyService) -> None:
        # "skill" contains "kill" but word boundary should prevent a false positive
        text = "She had great skill in archery."
        assert safety.is_text_safe(text, AgeSetting.CHILDREN_5_8) is True

    def test_exact_match_blocked(self, safety: SafetyService) -> None:
        text = "They tried to kill the dragon."
        assert safety.is_text_safe(text, AgeSetting.CHILDREN_5_8) is False


class TestImagenPromptSanitization:
    def test_sanitize_adds_safety(self, safety: SafetyService) -> None:
        prompt = "A dragon flying over mountains"
        sanitized = safety.validate_imagen_prompt(prompt)
        assert prompt in sanitized
        assert "Safe for children" in sanitized
        assert "family-friendly" in sanitized

    def test_empty_prompt(self, safety: SafetyService) -> None:
        sanitized = safety.validate_imagen_prompt("")
        assert "Safe for children" in sanitized
