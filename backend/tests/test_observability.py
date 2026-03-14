"""Tests for the observability module (tracing + metrics)."""

from __future__ import annotations

import time

import pytest
from app.observability.metrics import Counter, Gauge, Histogram, MetricsCollector
from app.observability.trace import Span, SpanStatus, Tracer, traced


# ---------------------------------------------------------------------------
# Tracer tests
# ---------------------------------------------------------------------------


class TestSpanViaTracer:
    """Spans should be created through Tracer.start_span, not directly."""

    def test_span_creation(self) -> None:
        tracer = Tracer()
        s = tracer.start_span("test_op")
        assert s.name == "test_op"
        assert s.trace_id
        assert s.span_id
        assert s.status == SpanStatus.RUNNING
        assert isinstance(s.attributes, dict)
        assert isinstance(s.events, list)

    def test_set_attribute(self) -> None:
        tracer = Tracer()
        s = tracer.start_span("op")
        s.set_attribute("key", "value")
        assert s.attributes["key"] == "value"

    def test_add_event(self) -> None:
        tracer = Tracer()
        s = tracer.start_span("op")
        s.add_event("thing_happened", {"detail": 42})
        assert len(s.events) == 1
        assert s.events[0].name == "thing_happened"
        assert s.events[0].attributes["detail"] == 42

    def test_span_to_dict(self) -> None:
        tracer = Tracer()
        s = tracer.start_span("op", attributes={"k": "v"})
        tracer.end_span(s, SpanStatus.OK)
        d = s.to_dict()
        assert d["name"] == "op"
        assert d["status"] == "ok"
        assert d["attributes"]["k"] == "v"
        assert d["duration_ms"] is not None


class TestTracer:
    @pytest.fixture(autouse=True)
    def fresh_tracer(self) -> Tracer:
        self.tracer = Tracer()
        return self.tracer

    def test_start_and_end_span(self) -> None:
        span = self.tracer.start_span("test_op")
        assert len(self.tracer.get_active_spans()) == 1
        self.tracer.end_span(span, SpanStatus.OK)
        assert len(self.tracer.get_active_spans()) == 0

    def test_span_duration_positive(self) -> None:
        span = self.tracer.start_span("timed_op")
        time.sleep(0.01)
        self.tracer.end_span(span, SpanStatus.OK)
        assert span.duration_ms is not None
        assert span.duration_ms > 0

    def test_get_trace(self) -> None:
        span = self.tracer.start_span("my_op")
        self.tracer.end_span(span, SpanStatus.OK)
        result = self.tracer.get_trace(span.trace_id)
        assert len(result) == 1
        assert result[0]["name"] == "my_op"

    def test_get_traces(self) -> None:
        for i in range(5):
            s = self.tracer.start_span(f"op_{i}")
            self.tracer.end_span(s, SpanStatus.OK)
        recent = self.tracer.get_traces(limit=3)
        assert len(recent) == 3

    def test_filter_by_tool_name(self) -> None:
        s1 = self.tracer.start_span("generate_story_page")
        self.tracer.end_span(s1, SpanStatus.OK)
        s2 = self.tracer.start_span("other_tool")
        self.tracer.end_span(s2, SpanStatus.OK)
        filtered = self.tracer.get_traces(tool_name="generate_story_page")
        assert all(s["name"] == "generate_story_page" for s in filtered)
        assert len(filtered) == 1

    def test_ring_buffer_eviction(self) -> None:
        """Spans beyond max_spans should be evicted."""
        tracer = Tracer(max_spans=5)
        for i in range(10):
            s = tracer.start_span(f"op_{i}")
            tracer.end_span(s, SpanStatus.OK)
        all_spans = tracer.get_traces(limit=100)
        assert len(all_spans) == 5

    def test_parent_span(self) -> None:
        parent = self.tracer.start_span("parent_op")
        child = self.tracer.start_span("child_op", parent=parent)
        assert child.parent_id == parent.span_id
        assert child.trace_id == parent.trace_id
        self.tracer.end_span(child, SpanStatus.OK)
        self.tracer.end_span(parent, SpanStatus.OK)

    def test_span_with_attributes(self) -> None:
        span = self.tracer.start_span("op", attributes={"k": "v"})
        assert span.attributes["k"] == "v"
        self.tracer.end_span(span, SpanStatus.OK)

    def test_end_span_error(self) -> None:
        span = self.tracer.start_span("fail_op")
        self.tracer.end_span(span, SpanStatus.ERROR)
        assert span.status == SpanStatus.ERROR

    def test_total_spans(self) -> None:
        s = self.tracer.start_span("op")
        self.tracer.end_span(s, SpanStatus.OK)
        assert self.tracer.total_spans == 1

    def test_clear(self) -> None:
        s = self.tracer.start_span("op")
        self.tracer.end_span(s, SpanStatus.OK)
        self.tracer.clear()
        assert self.tracer.total_spans == 0


# ---------------------------------------------------------------------------
# @traced decorator tests (uses the global singleton tracer)
# ---------------------------------------------------------------------------


class TestTracedDecorator:
    @pytest.mark.asyncio
    async def test_decorator_traces_call(self) -> None:
        @traced(name="my_func_test")
        async def my_func(x: int) -> int:
            return x * 2

        result = await my_func(5)
        assert result == 10

    @pytest.mark.asyncio
    async def test_decorator_captures_error(self) -> None:
        @traced(name="failing_func_test")
        async def failing_func() -> None:
            raise ValueError("boom")

        with pytest.raises(ValueError):
            await failing_func()


# ---------------------------------------------------------------------------
# Metrics tests
# ---------------------------------------------------------------------------


class TestCounter:
    def test_increment(self) -> None:
        c = Counter("test_total")
        c.inc()
        c.inc()
        assert c.value == 2

    def test_increment_with_amount(self) -> None:
        c = Counter("test_total")
        c.inc(amount=5)
        assert c.value == 5

    def test_labels(self) -> None:
        c = Counter("test_total")
        c.inc(labels={"service": "writer"})
        c.inc(labels={"service": "image"})
        c.inc(labels={"service": "writer"})
        # Overall value tracks all increments
        assert c.value == 3

    def test_no_increments(self) -> None:
        c = Counter("test_total")
        assert c.value == 0

    def test_snapshot(self) -> None:
        c = Counter("test_total")
        c.inc()
        snap = c.snapshot()
        assert snap["value"] == 1
        assert snap["type"] == "counter"

    def test_negative_raises(self) -> None:
        c = Counter("test_total")
        with pytest.raises(ValueError, match="incremented"):
            c.inc(amount=-1)


class TestHistogram:
    def test_observe(self) -> None:
        h = Histogram("duration")
        h.observe(1.0)
        h.observe(2.0)
        h.observe(3.0)
        snap = h.snapshot()
        assert snap["count"] == 3
        assert snap["min"] == 1.0
        assert snap["max"] == 3.0

    def test_empty_histogram(self) -> None:
        h = Histogram("empty")
        snap = h.snapshot()
        assert snap["count"] == 0
        assert snap["min"] is None

    def test_mean(self) -> None:
        h = Histogram("latency")
        h.observe(10.0)
        h.observe(20.0)
        snap = h.snapshot()
        assert snap["mean"] == pytest.approx(15.0, rel=0.01)

    def test_count_property(self) -> None:
        h = Histogram("test")
        h.observe(1.0)
        h.observe(2.0)
        assert h.count == 2


class TestGauge:
    def test_inc_dec(self) -> None:
        g = Gauge("connections")
        g.inc()
        g.inc()
        assert g.value == 2
        g.dec()
        assert g.value == 1

    def test_set(self) -> None:
        g = Gauge("memory")
        g.set(42.0)
        assert g.value == 42.0

    def test_snapshot(self) -> None:
        g = Gauge("test")
        g.set(7.0)
        snap = g.snapshot()
        assert snap["value"] == 7.0
        assert snap["type"] == "gauge"


class TestMetricsCollector:
    def test_collector_has_expected_metrics(self) -> None:
        mc = MetricsCollector()
        assert hasattr(mc, "tool_calls_total")
        assert hasattr(mc, "pages_generated")
        assert hasattr(mc, "safety_blocks")
        assert hasattr(mc, "errors")
        assert hasattr(mc, "api_calls")
        assert hasattr(mc, "tool_duration")
        assert hasattr(mc, "api_latency")
        assert hasattr(mc, "active_sessions")
        assert hasattr(mc, "active_websockets")

    def test_snapshot_structure(self) -> None:
        mc = MetricsCollector()
        snap = mc.snapshot()
        assert "counters" in snap
        assert "histograms" in snap
        assert "gauges" in snap
        assert "uptime_seconds" in snap

    def test_counter_integration(self) -> None:
        mc = MetricsCollector()
        mc.tool_calls_total.inc()
        mc.tool_calls_total.inc()
        snap = mc.snapshot()
        assert snap["counters"]["tool_calls_total"]["value"] == 2
