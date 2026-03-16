"""Story domain models — the core data structures for StoryForge.

These models represent the story state, pages, characters, and user directions.
The StoryState is the single source of truth for the entire story session.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class VisualStyle(StrEnum):
    """Available illustration styles."""

    WATERCOLOUR = "watercolour"
    DREAMY_PASTEL = "dreamy_pastel"
    PIXEL_ART = "pixel_art"
    INK_SKETCH = "ink_sketch"
    CINEMATIC = "cinematic"


class AgeSetting(StrEnum):
    """Age-calibrated story settings."""

    CHILDREN_5_8 = "children_5_8"
    TEEN_13_17 = "teen_13_17"
    ADULTS = "adults"
    EDUCATOR = "educator"


class DirectionType(StrEnum):
    """Type of user creative direction."""

    SEED = "seed"
    STEERING = "steering"
    ENDING = "ending"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------


class Character(BaseModel):
    """A character in the story."""

    name: str
    traits: list[str] = Field(default_factory=list)
    visual_description: str = ""
    first_appearance_page: int = 1


class Direction(BaseModel):
    """A single user creative direction entry."""

    page: int
    type: DirectionType
    input: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Page(BaseModel):
    """A single story page."""

    number: int
    text: str
    summary: str
    scene_description: str = ""
    image_base64: str | None = None
    narration_audio_base64: str | None = None
    image_url: str | None = None
    narration_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ---------------------------------------------------------------------------
# Core State
# ---------------------------------------------------------------------------

AGE_PROFILES = {
    AgeSetting.CHILDREN_5_8: {
        "label": "Children (5–8)",
        "vocabulary": "simple, clear sentences",
        "page_range": (6, 8),
        "tone": "warm, gentle, with a clear moral arc",
        "themes": "friendship, courage, discovery, kindness",
    },
    AgeSetting.TEEN_13_17: {
        "label": "Teen (13–17)",
        "vocabulary": "rich, expressive vocabulary with complex sentence structures",
        "page_range": (10, 15),
        "tone": "adventurous, with nuanced emotions and ambiguous endings allowed",
        "themes": "identity, adventure, mystery, coming-of-age, sacrifice",
    },
    AgeSetting.ADULTS: {
        "label": "Adults",
        "vocabulary": "sophisticated, literary prose with varied sentence structures",
        "page_range": (12, 20),
        "tone": "nuanced, emotionally complex, with layered storytelling",
        "themes": "love, loss, redemption, morality, self-discovery, legacy",
    },
    AgeSetting.EDUCATOR: {
        "label": "Educator",
        "vocabulary": "clear, engaging language with embedded learning moments",
        "page_range": (8, 12),
        "tone": "warm, instructive, with gentle lessons woven into narrative",
        "themes": "curiosity, growth, problem-solving, empathy, teamwork",
    },
}


class StoryState(BaseModel):
    """The master state object for a story session.

    This is the single source of truth — both the Live API agent and the
    story writer model read from this (via different projection methods).
    """

    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    seed: str = ""
    style: VisualStyle = VisualStyle.WATERCOLOUR
    age_setting: AgeSetting = AgeSetting.CHILDREN_5_8
    characters: list[Character] = Field(default_factory=list)
    world_rules: list[str] = Field(default_factory=list)
    pages: list[Page] = Field(default_factory=list)
    direction_log: list[Direction] = Field(default_factory=list)
    is_complete: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @property
    def current_page(self) -> int:
        """Current page number (0 if no pages yet)."""
        return len(self.pages)

    @property
    def age_profile(self) -> dict:
        """Get the age calibration profile."""
        return AGE_PROFILES[self.age_setting]

    @property
    def max_pages(self) -> int:
        """Maximum pages for this age setting."""
        return self.age_profile["page_range"][1]

    # ------------------------------------------------------------------
    # Context builders — projections for each model
    # ------------------------------------------------------------------

    def get_writer_context(
        self,
        page_number: int,
        user_direction: str | None = None,
    ) -> str:
        """Build a full context prompt for the story writer model (Gemini 3).

        This is a rich prompt (~8-15K tokens) with complete story state.
        """
        profile = self.age_profile

        writer_role = (
            "You are a young-adult fiction writer."
            if self.age_setting == AgeSetting.TEEN_13_17
            else "You are a children's storybook writer."
        )

        sections = [
            writer_role,
            "",
            "=== STORY CONFIGURATION ===",
            f"Visual style: {self.style.value}",
            f"Age group: {profile['label']}",
            f"Vocabulary: {profile['vocabulary']}",
            f"Tone: {profile['tone']}",
            f"Themes: {profile['themes']}",
            f"Target pages: {profile['page_range'][0]}-{profile['page_range'][1]}",
            "",
            "=== STORY SEED ===",
            self.seed,
        ]

        if self.characters:
            sections.append("")
            sections.append("=== CHARACTERS ===")
            for c in self.characters:
                traits = ", ".join(c.traits) if c.traits else "no traits defined yet"
                sections.append(f"- {c.name}: {traits}. {c.visual_description}")

        if self.world_rules:
            sections.append("")
            sections.append("=== WORLD RULES ===")
            for rule in self.world_rules:
                sections.append(f"- {rule}")

        if self.pages:
            sections.append("")
            sections.append("=== STORY SO FAR (summaries) ===")
            for page in self.pages:
                sections.append(f"Page {page.number}: {page.summary}")

            sections.append("")
            sections.append("=== PREVIOUS PAGE (full text, for continuity) ===")
            sections.append(self.pages[-1].text)

        if self.direction_log:
            sections.append("")
            sections.append("=== DIRECTION LOG (user's creative inputs) ===")
            for d in self.direction_log:
                sections.append(f"[Page {d.page}, {d.type.value}]: {d.input}")

        if user_direction:
            sections.append("")
            sections.append("=== NEW DIRECTION ===")
            sections.append(user_direction)

        sections.append("")
        sections.append("=== TASK ===")
        sections.append(f"Write page {page_number} of the story.")
        sections.append("")
        sections.append(
            "Respond with a JSON object containing:\n"
            '- "text": the full story page text\n'
            '- "summary": a one-line summary of this page\n'
            '- "scene_description": a visual description for the illustrator\n'
            '- "new_characters": list of {name, traits, visual_description} for any new characters\n'
            '- "world_rule_changes": list of new world rules introduced on this page'
        )

        return "\n".join(sections)

    def get_live_summary(self) -> str:
        """Build a brief summary for the Live API agent (~150 tokens).

        This keeps the Live API context lean while giving it enough
        to understand the current story state for conversation.
        """
        if not self.pages:
            return (
                f'Story seed: "{self.seed}"\n'
                f"Style: {self.style.value}, Age: {self.age_profile['label']}\n"
                f"No pages generated yet. Help the user flesh out their idea."
            )

        char_names = (
            ", ".join(c.name for c in self.characters) if self.characters else "none defined"
        )
        last_summary = self.pages[-1].summary

        return (
            f'Story about: "{self.seed}"\n'
            f"Characters: {char_names}\n"
            f"Page {self.current_page} of ~{self.max_pages}\n"
            f"Last event: {last_summary}\n"
            f"Style: {self.style.value}, Age: {self.age_profile['label']}"
        )
