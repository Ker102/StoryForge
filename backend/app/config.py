"""Environment configuration using Pydantic Settings."""

import logging
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    google_api_key: str = ""

    @field_validator("google_api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        if not v:
            logger.warning(
                "GOOGLE_API_KEY is not set — AI features will fail. "
                "Set it in .env or as an environment variable."
            )
        return v

    # Model configuration
    live_model: str = "gemini-2.5-flash-native-audio-latest"
    writer_model: str = "gemini-3-flash-preview"
    image_model: str = "imagen-4.0-generate-001"
    fallback_image_model: str = "gemini-2.5-flash-image"
    narration_model: str = "gemini-2.5-flash-tts-preview"

    # Defaults
    default_age_setting: str = "children_5_8"
    default_style: str = "watercolour"

    # Firebase
    firebase_service_account_path: str = "serviceAccountKey.json"
    firebase_project_id: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    model_config = {
        "env_file": ".env.storyforge",
        "env_file_encoding": "utf-8",
        "extra": "ignore",  # .env.storyforge has frontend Firebase vars we don't need
    }


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
