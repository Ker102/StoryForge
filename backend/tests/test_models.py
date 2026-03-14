"""Tests for StoryForge domain models."""

from __future__ import annotations

import uuid

import pytest
from app.models.story import (
    AgeSetting,
    Character,
    Direction,
    DirectionType,
    Page,
    StoryState,
    VisualStyle,
)


# ---------------------------------------------------------------------------
# Enum tests
# ---------------------------------------------------------------------------


class TestEnums:
    """Verify enum values match expected strings."""

    def test_visual_styles(self) -> None:
        assert VisualStyle.WATERCOLOUR == "watercolour"
        assert VisualStyle.PIXEL_ART == "pixel_art"
        assert VisualStyle.CINEMATIC == "cinematic"

    def test_age_settings(self) -> None:
        assert AgeSetting.CHILDREN_5_8 == "children_5_8"
        assert AgeSetting.TEEN_13_17 == "teen_13_17"
        assert AgeSetting.ADULTS == "adults"
        assert AgeSetting.EDUCATOR == "educator"

    def test_direction_types(self) -> None:
        assert DirectionType.SEED == "seed"
        assert DirectionType.STEERING == "steering"
        assert DirectionType.ENDING == "ending"


# ---------------------------------------------------------------------------
# Character tests
# ---------------------------------------------------------------------------


class TestCharacter:
    def test_defaults(self) -> None:
        c = Character(name="Luna")
        assert c.name == "Luna"
        assert c.traits == []
        assert c.visual_description == ""
        assert c.first_appearance_page == 1

    def test_with_traits(self) -> None:
        c = Character(
            name="Finn",
            traits=["brave", "curious"],
            visual_description="A fox with a red scarf",
            first_appearance_page=3,
        )
        assert "brave" in c.traits
        assert c.first_appearance_page == 3


# ---------------------------------------------------------------------------
# Page tests
# ---------------------------------------------------------------------------


class TestPage:
    def test_minimal_page(self) -> None:
        p = Page(number=1, text="Hello!", summary="Intro")
        assert p.number == 1
        assert p.text == "Hello!"
        assert p.image_base64 is None
        assert p.narration_audio_base64 is None
        assert p.created_at is not None

    def test_full_page(self) -> None:
        p = Page(
            number=2,
            text="They found a cave.",
            summary="Cave discovery",
            scene_description="A dark cave entrance",
            image_base64="abc123",
            narration_audio_base64="def456",
        )
        assert p.scene_description == "A dark cave entrance"
        assert p.image_base64 == "abc123"


# ---------------------------------------------------------------------------
# Direction tests
# ---------------------------------------------------------------------------


class TestDirection:
    def test_seed_direction(self) -> None:
        d = Direction(page=0, type=DirectionType.SEED, input="A dragon story")
        assert d.type == DirectionType.SEED
        assert d.page == 0
        assert d.timestamp is not None


# ---------------------------------------------------------------------------
# StoryState tests
# ---------------------------------------------------------------------------


class TestStoryState:
    def test_defaults(self) -> None:
        state = StoryState()
        assert state.session_id  # non-empty UUID string
        assert state.seed == ""
        assert state.style == VisualStyle.WATERCOLOUR
        assert state.age_setting == AgeSetting.CHILDREN_5_8
        assert state.pages == []
        assert state.is_complete is False

    def test_current_page(self) -> None:
        state = StoryState()
        assert state.current_page == 0
        state.pages.append(Page(number=1, text="Page 1", summary="First page"))
        assert state.current_page == 1

    def test_age_profile_children(self) -> None:
        state = StoryState(age_setting=AgeSetting.CHILDREN_5_8)
        profile = state.age_profile
        assert "Children" in profile["label"]
        assert isinstance(profile["page_range"], tuple)

    def test_age_profile_teen(self) -> None:
        state = StoryState(age_setting=AgeSetting.TEEN_13_17)
        profile = state.age_profile
        assert "Teen" in profile["label"]

    def test_max_pages(self) -> None:
        state = StoryState(age_setting=AgeSetting.CHILDREN_5_8)
        assert state.max_pages == 8

        state_teen = StoryState(age_setting=AgeSetting.TEEN_13_17)
        assert state_teen.max_pages == 15

    def test_unique_session_ids(self) -> None:
        s1 = StoryState()
        s2 = StoryState()
        assert s1.session_id != s2.session_id

    def test_writer_context_no_pages(self) -> None:
        state = StoryState(seed="A dragon adventure")
        ctx = state.get_writer_context(page_number=1)
        assert "A dragon adventure" in ctx
        assert "page 1" in ctx.lower()
        assert "JSON" in ctx

    def test_writer_context_with_pages(self) -> None:
        state = StoryState(seed="Magic forest")
        state.pages.append(
            Page(number=1, text="Once upon a time...", summary="Story begins")
        )
        ctx = state.get_writer_context(page_number=2)
        assert "STORY SO FAR" in ctx
        assert "Story begins" in ctx
        assert "Once upon a time..." in ctx

    def test_writer_context_with_characters(self) -> None:
        state = StoryState(seed="Test")
        state.characters.append(Character(name="Luna", traits=["kind"]))
        ctx = state.get_writer_context(page_number=1)
        assert "Luna" in ctx
        assert "kind" in ctx

    def test_writer_context_with_direction(self) -> None:
        state = StoryState(seed="Test")
        ctx = state.get_writer_context(page_number=1, user_direction="add a cat")
        assert "add a cat" in ctx

    def test_live_summary_no_pages(self) -> None:
        state = StoryState(seed="Space journey")
        summary = state.get_live_summary()
        assert "Space journey" in summary
        assert "No pages generated" in summary

    def test_live_summary_with_pages(self) -> None:
        state = StoryState(seed="Space journey")
        state.characters.append(Character(name="Astro"))
        state.pages.append(
            Page(number=1, text="Blastoff!", summary="Launch into space")
        )
        summary = state.get_live_summary()
        assert "Astro" in summary
        assert "Launch into space" in summary

    def test_serialization_roundtrip(self) -> None:
        state = StoryState(
            seed="Roundtrip test",
            style=VisualStyle.PIXEL_ART,
            age_setting=AgeSetting.TEEN_13_17,
        )
        state.pages.append(Page(number=1, text="Page text", summary="Summary"))
        data = state.model_dump()
        restored = StoryState.model_validate(data)
        assert restored.session_id == state.session_id
        assert restored.pages[0].text == "Page text"
