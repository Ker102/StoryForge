"""Firebase Admin SDK initialization and helpers.

Provides lazy-initialized access to Firebase Auth, Firestore, and Storage.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

from app.config import get_settings

logger = logging.getLogger(__name__)

_app: firebase_admin.App | None = None
_app_lock = threading.Lock()


def _get_app() -> firebase_admin.App:
    """Lazily initialise the Firebase Admin SDK.

    Tries three credential sources in order:
    1. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string)
    2. File path from settings.firebase_service_account_path
    3. Application Default Credentials (for Cloud Run with service account)
    """
    global _app
    if _app is not None:
        return _app

    with _app_lock:
        if _app is not None:
            return _app

        settings = get_settings()
        cred = None

        # Method 1: JSON env var (preferred for Cloud Run)
        key_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "")
        if key_json and key_json.strip().startswith("{"):
            try:
                key_data = json.loads(key_json)
                cred = credentials.Certificate(key_data)
                logger.info("Firebase: using FIREBASE_SERVICE_ACCOUNT_KEY env var")
            except (json.JSONDecodeError, ValueError) as exc:
                logger.warning("Firebase: FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON: %s", exc)

        # Method 2: File path
        if cred is None:
            cred_path = Path(settings.firebase_service_account_path)
            if cred_path.is_file():
                try:
                    cred = credentials.Certificate(str(cred_path))
                    logger.info("Firebase: using key file at %s", cred_path)
                except (ValueError, Exception) as exc:
                    logger.error("Firebase: failed to load key file %s: %s", cred_path, exc)
            else:
                logger.warning("Firebase service account key not found at %s", cred_path)

        # Method 3: Application Default Credentials
        if cred is None:
            try:
                cred = credentials.ApplicationDefault()
                logger.info("Firebase: using Application Default Credentials")
            except Exception as exc:
                logger.error("Firebase: no credentials found (no env var, no file, no ADC)")
                raise FileNotFoundError(
                    "No Firebase credentials: set FIREBASE_SERVICE_ACCOUNT_KEY env var "
                    "or provide serviceAccountKey.json"
                ) from exc

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
