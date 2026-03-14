"""Tests for FastAPI endpoints (health + observability dashboard).

We use unittest.mock to patch out firebase_admin before it gets imported
by the auth middleware, avoiding a hard dependency on firebase_admin
during unit tests.
"""

from __future__ import annotations

import sys
import types
from unittest.mock import MagicMock

# ---- Stub out firebase_admin BEFORE any app code imports it ----
_fb_stub = types.ModuleType("firebase_admin")
_fb_stub.get_app = MagicMock(side_effect=ValueError("stub"))  # type: ignore[attr-defined]
_fb_stub.initialize_app = MagicMock()  # type: ignore[attr-defined]
_fb_stub.credentials = MagicMock()  # type: ignore[attr-defined]

_fb_auth = types.ModuleType("firebase_admin.auth")
_fb_auth.InvalidIdTokenError = type("InvalidIdTokenError", (Exception,), {})  # type: ignore[attr-defined]
_fb_auth.ExpiredIdTokenError = type("ExpiredIdTokenError", (Exception,), {})  # type: ignore[attr-defined]
_fb_auth.RevokedIdTokenError = type("RevokedIdTokenError", (Exception,), {})  # type: ignore[attr-defined]
_fb_auth.CertificateFetchError = type("CertificateFetchError", (Exception,), {})  # type: ignore[attr-defined]
_fb_auth.verify_id_token = MagicMock(return_value={"uid": "test"})  # type: ignore[attr-defined]

_fb_firestore = types.ModuleType("firebase_admin.firestore")
_fb_firestore.client = MagicMock()  # type: ignore[attr-defined]

_fb_storage = types.ModuleType("firebase_admin.storage")
_fb_storage.bucket = MagicMock()  # type: ignore[attr-defined]

sys.modules.setdefault("firebase_admin", _fb_stub)
sys.modules.setdefault("firebase_admin.auth", _fb_auth)
sys.modules.setdefault("firebase_admin.firestore", _fb_firestore)
sys.modules.setdefault("firebase_admin.storage", _fb_storage)
# ---- End stubs ----

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Async HTTP test client for the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------


class TestHealth:
    @pytest.mark.asyncio
    async def test_health_returns_ok(self, client: AsyncClient) -> None:
        resp = await client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["service"] == "storyforge-backend"


# ---------------------------------------------------------------------------
# Observability endpoints
# ---------------------------------------------------------------------------


class TestObservabilityEndpoints:
    @pytest.mark.asyncio
    async def test_extended_health(self, client: AsyncClient) -> None:
        resp = await client.get("/observability/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "uptime_seconds" in body
        assert "summary" in body

    @pytest.mark.asyncio
    async def test_metrics_endpoint(self, client: AsyncClient) -> None:
        resp = await client.get("/observability/metrics")
        assert resp.status_code == 200
        body = resp.json()
        assert "counters" in body
        assert "histograms" in body
        assert "gauges" in body

    @pytest.mark.asyncio
    async def test_traces_endpoint(self, client: AsyncClient) -> None:
        resp = await client.get("/observability/traces")
        assert resp.status_code == 200
        body = resp.json()
        assert "spans" in body
        assert "count" in body

    @pytest.mark.asyncio
    async def test_traces_with_filter(self, client: AsyncClient) -> None:
        resp = await client.get("/observability/traces?tool_name=some_tool")
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["spans"], list)

    @pytest.mark.asyncio
    async def test_active_spans_endpoint(self, client: AsyncClient) -> None:
        resp = await client.get("/observability/active")
        assert resp.status_code == 200
        body = resp.json()
        assert "spans" in body
