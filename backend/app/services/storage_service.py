"""Firebase Storage service for media uploads.

Stores files at: stories/{session_id}/page_{n}/image.png etc.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from app.services.firebase import get_storage_bucket

logger = logging.getLogger(__name__)


async def upload_image(
    session_id: str,
    page_number: int,
    image_bytes: bytes,
) -> str | None:
    """Upload a page illustration to Firebase Storage.

    Args:
        session_id: Story session ID.
        page_number: Page number for the image.
        image_bytes: Raw image bytes (PNG).

    Returns:
        Public download URL, or None on failure.
    """
    path = f"stories/{session_id}/page_{page_number}/illustration.png"
    return await _upload_file(path, image_bytes, "image/png")


async def upload_audio(
    session_id: str,
    page_number: int,
    audio_bytes: bytes,
) -> str | None:
    """Upload page narration audio to Firebase Storage.

    Args:
        session_id: Story session ID.
        page_number: Page number for the audio.
        audio_bytes: Raw audio bytes (WAV/MP3).

    Returns:
        Public download URL, or None on failure.
    """
    path = f"stories/{session_id}/page_{page_number}/narration.mp3"
    return await _upload_file(path, audio_bytes, "audio/mpeg")


async def upload_pdf(
    session_id: str,
    pdf_bytes: bytes,
) -> str | None:
    """Upload a story's exported PDF to Firebase Storage.

    Args:
        session_id: Story session ID.
        pdf_bytes: Raw PDF bytes.

    Returns:
        Public download URL, or None on failure.
    """
    path = f"stories/{session_id}/export.pdf"
    return await _upload_file(path, pdf_bytes, "application/pdf")


async def _upload_file(
    path: str,
    data: bytes,
    content_type: str,
) -> str | None:
    """Upload a file to Firebase Storage and return a signed URL.

    Args:
        path: Storage path (e.g., stories/abc/page_1/illustration.png).
        data: File bytes.
        content_type: MIME type.

    Returns:
        Signed URL valid for 7 days, or None on failure.
    """
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(path)
        blob.upload_from_string(data, content_type=content_type)

        # Generate signed URL valid for 7 days
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=7),
            method="GET",
        )
        logger.info("Uploaded %s (%d bytes)", path, len(data))
        return url
    except FileNotFoundError:
        logger.warning("Firebase not configured — file not uploaded")
        return None
    except Exception as e:
        logger.error("Failed to upload %s: %s", path, e, exc_info=True)
        return None
