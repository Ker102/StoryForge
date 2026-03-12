"""Firebase Admin SDK initialization and helpers.

Provides lazy-initialized access to Firebase Auth, Firestore, and Storage.
"""

from __future__ import annotations

import logging
import threading
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

from app.config import get_settings

logger = logging.getLogger(__name__)

_app: firebase_admin.App | None = None
_app_lock = threading.Lock()


def _get_app() -> firebase_admin.App:
    """Lazily initialise the Firebase Admin SDK."""
    global _app
    if _app is not None:
        return _app

    with _app_lock:
        # Double-check after acquiring lock
        if _app is not None:
            return _app

        settings = get_settings()
        cred_path = Path(settings.firebase_service_account_path)

        if not cred_path.exists():
            logger.error(
                "Firebase service account key not found at %s",
                cred_path,
            )
            raise FileNotFoundError(f"Service account key not found: {cred_path}")

        cred = credentials.Certificate(str(cred_path))
        _app = firebase_admin.initialize_app(
            cred,
            {
                "storageBucket": f"{settings.firebase_project_id}.firebasestorage.app",
            },
        )
        logger.info("Firebase Admin SDK initialized (project=%s)", settings.firebase_project_id)
        return _app


def verify_id_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims.

    Args:
        id_token: The JWT token from the frontend Firebase Auth SDK.

    Returns:
        Decoded token dict with uid, email, name, etc.

    Raises:
        firebase_admin.auth.InvalidIdTokenError: If token is invalid.
        firebase_admin.auth.ExpiredIdTokenError: If token has expired.
    """
    _get_app()
    return auth.verify_id_token(id_token)


def get_firestore_client():
    """Get the Firestore client."""
    _get_app()
    return firestore.client()


def get_storage_bucket():
    """Get the default Firebase Storage bucket."""
    _get_app()
    return storage.bucket()
