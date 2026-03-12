"""Story State Manager — single source of truth for all story sessions.

In-memory store for hackathon speed. Firestore persistence can be added later.
"""

from __future__ import annotations

import logging

from app.models.story import (
    AgeSetting,
    Direction,
    DirectionType,
    StoryState,
    VisualStyle,
)

logger = logging.getLogger(__name__)


class StoryStateManager:
    """Manages story sessions in memory."""

    def __init__(self) -> None:
        self._sessions: dict[str, StoryState] = {}

    def create_session(
        self,
        style: str = "watercolour",
        age_setting: str = "children_5_8",
        seed: str = "",
    ) -> StoryState:
        """Create a new story session.

        Args:
            style: Visual style key.
            age_setting: Age setting key.
            seed: Initial story seed (optional, can be set later via voice).

        Returns:
            The new StoryState.
        """
        try:
            state = StoryState(
                style=VisualStyle(style),
                age_setting=AgeSetting(age_setting),
                seed=seed,
            )
        except ValueError as e:
            raise ValueError(f"Invalid style '{style}' or age_setting '{age_setting}': {e}") from e

        # Log initial seed as a direction
        if seed:
            state.direction_log.append(Direction(page=0, type=DirectionType.SEED, input=seed))

        self._sessions[state.session_id] = state
        logger.info(
            "Created session %s: style=%s, age=%s",
            state.session_id,
            style,
            age_setting,
        )
        return state

    def get_session(self, session_id: str) -> StoryState | None:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    def set_seed(self, session_id: str, seed: str) -> None:
        """Set or update the story seed (typically from voice input)."""
        state = self._sessions.get(session_id)
        if state:
            state.seed = seed
            state.direction_log.append(Direction(page=0, type=DirectionType.SEED, input=seed))
            logger.info("Session %s seed set (%d chars)", session_id, len(seed))

    def delete_session(self, session_id: str) -> None:
        """Remove a session."""
        removed = self._sessions.pop(session_id, None)
        if removed:
            logger.info("Deleted session %s", session_id)
        else:
            logger.debug("No session to delete: %s", session_id)

    @property
    def active_sessions(self) -> int:
        """Number of active sessions."""
        return len(self._sessions)


# Singleton instance
state_manager = StoryStateManager()
