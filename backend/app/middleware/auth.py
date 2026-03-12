"""Authentication middleware for WebSocket and REST endpoints."""

from __future__ import annotations

import asyncio
import logging
from functools import partial

from firebase_admin.auth import (
    ExpiredIdTokenError,
    InvalidIdTokenError,
    RevokedIdTokenError,
)

from app.services.firebase import verify_id_token

logger = logging.getLogger(__name__)


async def verify_firebase_token(token: str | None) -> dict | None:
    """Verify a Firebase ID token.

    Args:
        token: The Firebase ID token string. May be None for
               unauthenticated/demo sessions.

    Returns:
        Decoded token dict with uid, email, name, etc.
        None if token is missing or invalid.
    """
    if not token:
        logger.warning("No auth token provided — session will be anonymous")
        return None

    try:
        loop = asyncio.get_running_loop()
        decoded = await loop.run_in_executor(None, partial(verify_id_token, token))
        logger.info(
            "Authenticated user: uid=%s",
            decoded.get("uid"),
        )
        return decoded
    except (InvalidIdTokenError, ExpiredIdTokenError, RevokedIdTokenError) as e:
        logger.warning("Auth token verification failed: %s", e)
        return None
    except FileNotFoundError:
        # Firebase not configured — allow anonymous
        logger.warning("Firebase not configured — skipping auth")
        return None
    except Exception as e:
        logger.error("Unexpected auth error: %s", e, exc_info=True)
        return None
