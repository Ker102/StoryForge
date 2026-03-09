"""Export route — PDF download endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.export_service import ExportService
from app.state.manager import state_manager

logger = logging.getLogger(__name__)
router = APIRouter()

export_service = ExportService()


@router.post("/pdf/{session_id}")
async def export_pdf(session_id: str):
    """Generate and download a PDF storybook.

    Args:
        session_id: The story session ID.

    Returns:
        PDF file as a downloadable response.
    """
    state = state_manager.get_session(session_id)

    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    if not state.pages:
        raise HTTPException(status_code=400, detail="No pages generated yet")

    logger.info(
        "Exporting PDF for session %s (%d pages)",
        session_id,
        len(state.pages),
    )

    pdf_bytes = export_service.generate_pdf(state)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="storyforge-{session_id[:8]}.pdf"'
        },
    )
