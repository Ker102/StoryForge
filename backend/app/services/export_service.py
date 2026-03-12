"""Export Service — PDF compilation for completed storybooks."""

from __future__ import annotations

import base64
import io
import logging
import xml.sax.saxutils

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image as RLImage,
)
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

from app.models.story import StoryState

logger = logging.getLogger(__name__)


class ExportService:
    """Compiles a story session into a downloadable PDF."""

    def generate_pdf(self, story_state: StoryState) -> bytes:
        """Generate a PDF storybook from the completed story.

        Args:
            story_state: The complete story state.

        Returns:
            PDF file as bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=0.75 * inch,
            rightMargin=0.75 * inch,
            topMargin=1 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "StoryTitle",
            parent=styles["Title"],
            fontSize=28,
            spaceAfter=30,
            alignment=TA_CENTER,
        )
        body_style = ParagraphStyle(
            "StoryBody",
            parent=styles["Normal"],
            fontSize=14,
            leading=20,
            spaceAfter=12,
        )
        page_num_style = ParagraphStyle(
            "PageNum",
            parent=styles["Normal"],
            fontSize=10,
            alignment=TA_CENTER,
            textColor="#888888",
        )

        story_elements = []

        # --- Title Page ---
        story_elements.append(Spacer(1, 2 * inch))
        title = self._derive_title(story_state)
        story_elements.append(Paragraph(title, title_style))
        story_elements.append(Spacer(1, 0.5 * inch))
        story_elements.append(
            Paragraph(
                f"A StoryForge Book • {story_state.age_profile['label']}",
                ParagraphStyle(
                    "subtitle", parent=styles["Normal"], alignment=TA_CENTER, fontSize=12
                ),
            )
        )

        # Add cover image if first page has an illustration
        if story_state.pages and story_state.pages[0].image_base64:
            story_elements.append(Spacer(1, 0.5 * inch))
            img = self._base64_to_image(story_state.pages[0].image_base64, width=4 * inch)
            if img:
                story_elements.append(img)

        story_elements.append(PageBreak())

        # --- Story Pages ---
        for page in story_state.pages:
            # Page illustration
            if page.image_base64:
                img = self._base64_to_image(page.image_base64, width=5.5 * inch)
                if img:
                    story_elements.append(img)
                    story_elements.append(Spacer(1, 0.3 * inch))

            # Page text (escaped for ReportLab XML parsing)
            story_elements.append(Paragraph(xml.sax.saxutils.escape(page.text), body_style))
            story_elements.append(Spacer(1, 0.3 * inch))

            # Page number
            story_elements.append(Paragraph(f"— {page.number} —", page_num_style))
            story_elements.append(PageBreak())

        # --- Build PDF ---
        doc.build(story_elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        logger.info("Generated PDF: %d bytes, %d pages", len(pdf_bytes), len(story_state.pages))
        return pdf_bytes

    def _derive_title(self, story_state: StoryState) -> str:
        """Derive a title from the story seed."""
        seed = story_state.seed
        if len(seed) > 60:
            seed = seed[:57] + "..."
        return seed.title() if seed else "My Story"

    def _base64_to_image(self, b64_str: str, width: float) -> RLImage | None:
        """Convert a base64 image string to a ReportLab Image."""
        try:
            img_bytes = base64.b64decode(b64_str)
            img_buffer = io.BytesIO(img_bytes)
            img = RLImage(img_buffer, width=width)
            img.hAlign = "CENTER"  # center the image horizontally
            return img
        except Exception as e:
            logger.error("Failed to decode image: %s", e)
            return None
