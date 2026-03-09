"""Environment configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    google_api_key: str = ""

    # Model configuration
    live_model: str = "gemini-live-2.5-flash-preview"
    writer_model: str = "gemini-3-flash-preview"
    image_model: str = "imagen-4.0-generate-001"
    fallback_image_model: str = "gemini-2.5-flash-image"
    narration_model: str = "gemini-2.5-flash-tts-preview"

    # Defaults
    default_age_setting: str = "children_5_8"
    default_style: str = "watercolour"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
