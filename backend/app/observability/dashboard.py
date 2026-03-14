"""Observability dashboard — REST API for monitoring the agent pipeline.

Provides endpoints for viewing metrics, traces, and system health.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Query

router = APIRouter(tags=["observability"])


@router.get("/health")
async def extended_health():
    """Extended health check with metric summary."""
    from app.observability import metrics, tracer

    snapshot = metrics.snapshot()
    return {
        "status": "ok",
        "service": "storyforge-backend",
        "uptime_seconds": snapshot["uptime_seconds"],
        "summary": {
            "total_tool_calls": metrics.tool_calls_total.value,
            "total_pages": metrics.pages_generated.value,
            "total_errors": metrics.errors.value,
            "active_sessions": metrics.active_sessions.value,
            "active_websockets": metrics.active_websockets.value,
            "total_traces": tracer.total_spans,
            "active_spans": len(tracer.get_active_spans()),
        },
        "timestamp": time.time(),
    }


@router.get("/metrics")
async def get_metrics():
    """Full metrics snapshot as JSON."""
    from app.observability import metrics

    return metrics.snapshot()


@router.get("/traces")
async def get_traces(
    limit: int = Query(default=50, ge=1, le=500),
    tool_name: str | None = Query(default=None, description="Filter by tool/span name"),
    session_id: str | None = Query(default=None, description="Filter by session ID"),
):
    """Get recent traces, optionally filtered.

    Args:
        limit: Maximum number of spans to return.
        tool_name: Partial match on span name.
        session_id: Exact match on session_id attribute.
    """
    from app.observability import tracer

    spans = tracer.get_traces(limit=limit, tool_name=tool_name, session_id=session_id)
    return {
        "count": len(spans),
        "spans": spans,
    }


@router.get("/traces/{trace_id}")
async def get_trace_detail(trace_id: str):
    """Get all spans belonging to a specific trace.

    Args:
        trace_id: The trace ID to look up.
    """
    from app.observability import tracer

    spans = tracer.get_trace(trace_id)
    if not spans:
        return {"error": "Trace not found", "trace_id": trace_id}
    return {
        "trace_id": trace_id,
        "span_count": len(spans),
        "spans": spans,
    }


@router.get("/active")
async def get_active_spans():
    """Get all currently running spans."""
    from app.observability import tracer

    active = tracer.get_active_spans()
    return {
        "count": len(active),
        "spans": active,
    }
