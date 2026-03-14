"""Span-based tracing for StoryForge agent pipeline.

Lightweight OpenTelemetry-inspired tracing with no external dependencies.
Spans are stored in a bounded ring buffer for memory safety.
"""

from __future__ import annotations

import asyncio
import functools
import logging
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

logger = logging.getLogger(__name__)


class SpanStatus(StrEnum):
    """Status of a trace span."""

    RUNNING = "running"
    OK = "ok"
    ERROR = "error"


@dataclass
class SpanEvent:
    """A timestamped event within a span."""

    name: str
    timestamp: float = field(default_factory=time.time)
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class Span:
    """A single unit of traced work."""

    trace_id: str
    span_id: str
    name: str
    start_time: float = field(default_factory=time.time)
    end_time: float | None = None
    status: SpanStatus = SpanStatus.RUNNING
    parent_id: str | None = None
    attributes: dict[str, Any] = field(default_factory=dict)
    events: list[SpanEvent] = field(default_factory=list)

    @property
    def duration_ms(self) -> float | None:
        """Duration in milliseconds, or None if still running."""
        if self.end_time is None:
            return None
        return round((self.end_time - self.start_time) * 1000, 2)

    def set_attribute(self, key: str, value: Any) -> None:
        """Set a key-value attribute on this span."""
        self.attributes[key] = value

    def add_event(self, name: str, attributes: dict[str, Any] | None = None) -> None:
        """Add a timestamped event to this span."""
        self.events.append(SpanEvent(name=name, attributes=attributes or {}))

    def end(self, status: SpanStatus = SpanStatus.OK) -> None:
        """Mark this span as complete."""
        self.end_time = time.time()
        self.status = status

    def to_dict(self) -> dict[str, Any]:
        """Serialize span to a dictionary for JSON output."""
        return {
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_ms": self.duration_ms,
            "status": self.status.value,
            "attributes": self.attributes,
            "events": [
                {
                    "name": e.name,
                    "timestamp": e.timestamp,
                    "attributes": e.attributes,
                }
                for e in self.events
            ],
        }


class Tracer:
    """Collects and stores trace spans in a bounded ring buffer."""

    def __init__(self, max_spans: int = 1000) -> None:
        self._spans: deque[Span] = deque(maxlen=max_spans)
        self._active_spans: dict[str, Span] = {}

    def start_span(
        self,
        name: str,
        parent: Span | None = None,
        attributes: dict[str, Any] | None = None,
    ) -> Span:
        """Create and start a new span.

        Args:
            name: Human-readable name for this operation.
            parent: Optional parent span (for nested traces).
            attributes: Optional initial attributes.

        Returns:
            The new active Span.
        """
        trace_id = parent.trace_id if parent else uuid.uuid4().hex[:16]
        span = Span(
            trace_id=trace_id,
            span_id=uuid.uuid4().hex[:16],
            name=name,
            parent_id=parent.span_id if parent else None,
            attributes=attributes or {},
        )
        self._active_spans[span.span_id] = span
        logger.debug("Span started: %s [%s]", name, span.span_id)
        return span

    def end_span(self, span: Span, status: SpanStatus = SpanStatus.OK) -> None:
        """End a span and move it to the completed buffer.

        Args:
            span: The span to end.
            status: Final status of the span.
        """
        span.end(status)
        self._active_spans.pop(span.span_id, None)
        self._spans.append(span)
        logger.debug(
            "Span ended: %s [%s] — %.2fms",
            span.name,
            span.span_id,
            span.duration_ms or 0,
        )

    def get_traces(
        self,
        limit: int = 50,
        tool_name: str | None = None,
        session_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Get recent traces, optionally filtered.

        Args:
            limit: Maximum number of spans to return.
            tool_name: Filter by span name (partial match).
            session_id: Filter by session_id attribute.

        Returns:
            List of span dicts, newest first.
        """
        spans = list(self._spans)
        spans.reverse()  # newest first

        if tool_name:
            spans = [s for s in spans if tool_name.lower() in s.name.lower()]

        if session_id:
            spans = [s for s in spans if s.attributes.get("session_id") == session_id]

        return [s.to_dict() for s in spans[:limit]]

    def get_trace(self, trace_id: str) -> list[dict[str, Any]]:
        """Get all spans belonging to a specific trace.

        Args:
            trace_id: The trace ID to look up.

        Returns:
            List of span dicts for the given trace.
        """
        return [s.to_dict() for s in self._spans if s.trace_id == trace_id]

    def get_active_spans(self) -> list[dict[str, Any]]:
        """Get all currently running spans."""
        return [s.to_dict() for s in self._active_spans.values()]

    @property
    def total_spans(self) -> int:
        """Total number of completed spans in the buffer."""
        return len(self._spans)

    def clear(self) -> None:
        """Clear all spans (useful for testing)."""
        self._spans.clear()
        self._active_spans.clear()


def traced(name: str | None = None, record_args: bool = True):
    """Decorator to auto-trace async functions.

    Args:
        name: Span name (defaults to function name).
        record_args: Whether to record function arguments as attributes.
    """

    def decorator(func):
        span_name = name or func.__name__

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Import here to avoid circular imports
            from app.observability import tracer as _tracer

            span = _tracer.start_span(span_name)

            if record_args:
                # Record keyword args (skip large binary data)
                for k, v in kwargs.items():
                    if isinstance(v, (str, int, float, bool)):
                        span.set_attribute(f"arg.{k}", v)
                    elif isinstance(v, str) and len(v) > 500:
                        span.set_attribute(f"arg.{k}", f"<{len(v)} chars>")

            try:
                result = await func(*args, **kwargs)
                span.add_event("completed")

                # Record result summary
                if isinstance(result, dict):
                    span.set_attribute("result.status", result.get("status", "unknown"))
                    if "page_number" in result:
                        span.set_attribute("result.page_number", result["page_number"])

                _tracer.end_span(span, SpanStatus.OK)
                return result

            except Exception as exc:
                span.add_event("error", {"error.type": type(exc).__name__, "error.message": str(exc)})
                _tracer.end_span(span, SpanStatus.ERROR)
                raise

        return wrapper

    return decorator
