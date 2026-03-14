"""Tests for StoryStateManager session management."""

from __future__ import annotations

import pytest
from app.models.story import AgeSetting, DirectionType, VisualStyle
from app.state.manager import StoryStateManager


@pytest.fixture
def manager() -> StoryStateManager:
    """Fresh manager for each test (no singleton leaks)."""
    return StoryStateManager()


class TestCreateSession:
    def test_basic_creation(self, manager: StoryStateManager) -> None:
        state = manager.create_session()
        assert state.session_id
        assert state.style == VisualStyle.WATERCOLOUR
        assert state.age_setting == AgeSetting.CHILDREN_5_8
        assert manager.active_sessions == 1

    def test_with_custom_params(self, manager: StoryStateManager) -> None:
        state = manager.create_session(
            style="pixel_art",
            age_setting="teen_13_17",
            seed="A robot in the future",
        )
        assert state.style == VisualStyle.PIXEL_ART
        assert state.age_setting == AgeSetting.TEEN_13_17
        assert state.seed == "A robot in the future"

    def test_seed_logged_as_direction(self, manager: StoryStateManager) -> None:
        state = manager.create_session(seed="Dragon adventure")
        assert len(state.direction_log) == 1
        assert state.direction_log[0].type == DirectionType.SEED
        assert state.direction_log[0].input == "Dragon adventure"

    def test_no_seed_no_direction(self, manager: StoryStateManager) -> None:
        state = manager.create_session()
        assert len(state.direction_log) == 0

    def test_invalid_style_raises(self, manager: StoryStateManager) -> None:
        with pytest.raises(ValueError, match="Invalid style"):
            manager.create_session(style="nonexistent")

    def test_invalid_age_raises(self, manager: StoryStateManager) -> None:
        with pytest.raises(ValueError, match="Invalid style"):
            manager.create_session(age_setting="toddler")


class TestGetSession:
    def test_get_existing(self, manager: StoryStateManager) -> None:
        state = manager.create_session()
        retrieved = manager.get_session(state.session_id)
        assert retrieved is state  # same object reference

    def test_get_nonexistent(self, manager: StoryStateManager) -> None:
        assert manager.get_session("fake-id") is None


class TestSetSeed:
    def test_set_seed_updates(self, manager: StoryStateManager) -> None:
        state = manager.create_session()
        manager.set_seed(state.session_id, "New seed")
        assert state.seed == "New seed"
        assert any(d.input == "New seed" for d in state.direction_log)

    def test_set_seed_nonexistent_no_error(self, manager: StoryStateManager) -> None:
        # Should not raise
        manager.set_seed("no-such-id", "Some seed")


class TestDeleteSession:
    def test_delete_existing(self, manager: StoryStateManager) -> None:
        state = manager.create_session()
        manager.delete_session(state.session_id)
        assert manager.active_sessions == 0
        assert manager.get_session(state.session_id) is None

    def test_delete_nonexistent_no_error(self, manager: StoryStateManager) -> None:
        # Should not raise
        manager.delete_session("nonexistent-id")


class TestActiveSessions:
    def test_count_multiple(self, manager: StoryStateManager) -> None:
        manager.create_session()
        manager.create_session()
        manager.create_session()
        assert manager.active_sessions == 3

    def test_count_after_delete(self, manager: StoryStateManager) -> None:
        s1 = manager.create_session()
        s2 = manager.create_session()
        manager.delete_session(s1.session_id)
        assert manager.active_sessions == 1
