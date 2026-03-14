"""Lightweight metrics for StoryForge — counters, histograms, gauges.

Thread-safe, no external dependencies, designed for in-process monitoring.
"""

from __future__ import annotations

import statistics
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Counter:
    """A monotonically increasing counter."""

    name: str
    description: str = ""
    _value: float = 0.0
    _labels: dict[str, float] = field(default_factory=lambda: defaultdict(float))
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def inc(self, amount: float = 1.0, labels: dict[str, str] | None = None) -> None:
        """Increment the counter.

        Args:
            amount: Amount to increment by (must be positive).
            labels: Optional label dict for dimensional metrics.
        """
        if amount < 0:
            raise ValueError("Counter can only be incremented")
        with self._lock:
            self._value += amount
            if labels:
                key = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
                self._labels[key] += amount

    @property
    def value(self) -> float:
        """Current counter value."""
        return self._value

    def snapshot(self) -> dict[str, Any]:
        """Return counter state as a dict."""
        with self._lock:
            return {
                "name": self.name,
                "type": "counter",
                "value": self._value,
                "by_label": dict(self._labels),
            }


@dataclass
class Histogram:
    """Collects numerical observations and provides stats."""

    name: str
    description: str = ""
    _observations: list[float] = field(default_factory=list)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def observe(self, value: float) -> None:
        """Record an observation.

        Args:
            value: The value to record.
        """
        with self._lock:
            self._observations.append(value)

    @property
    def count(self) -> int:
        """Number of observations."""
        return len(self._observations)

    def snapshot(self) -> dict[str, Any]:
        """Return histogram stats as a dict."""
        with self._lock:
            obs = list(self._observations)

        if not obs:
            return {
                "name": self.name,
                "type": "histogram",
                "count": 0,
                "sum": 0,
                "min": None,
                "max": None,
                "mean": None,
                "p50": None,
                "p95": None,
                "p99": None,
            }

        obs_sorted = sorted(obs)
        return {
            "name": self.name,
            "type": "histogram",
            "count": len(obs),
            "sum": round(sum(obs), 4),
            "min": round(min(obs), 4),
            "max": round(max(obs), 4),
            "mean": round(statistics.mean(obs), 4),
            "p50": round(obs_sorted[len(obs_sorted) // 2], 4),
            "p95": round(obs_sorted[int(len(obs_sorted) * 0.95)], 4) if len(obs) >= 2 else round(obs_sorted[-1], 4),
            "p99": round(obs_sorted[int(len(obs_sorted) * 0.99)], 4) if len(obs) >= 2 else round(obs_sorted[-1], 4),
        }


@dataclass
class Gauge:
    """A value that can go up and down."""

    name: str
    description: str = ""
    _value: float = 0.0
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def inc(self, amount: float = 1.0) -> None:
        """Increase the gauge."""
        with self._lock:
            self._value += amount

    def dec(self, amount: float = 1.0) -> None:
        """Decrease the gauge."""
        with self._lock:
            self._value -= amount

    def set(self, value: float) -> None:
        """Set the gauge to a specific value."""
        with self._lock:
            self._value = value

    @property
    def value(self) -> float:
        """Current gauge value."""
        return self._value

    def snapshot(self) -> dict[str, Any]:
        """Return gauge state as a dict."""
        return {
            "name": self.name,
            "type": "gauge",
            "value": self._value,
        }


class MetricsCollector:
    """Central registry for all application metrics."""

    def __init__(self) -> None:
        # Counters
        self.tool_calls_total = Counter(
            name="tool_calls_total",
            description="Total number of ADK tool invocations",
        )
        self.pages_generated = Counter(
            name="pages_generated",
            description="Total story pages generated",
        )
        self.safety_blocks = Counter(
            name="safety_blocks",
            description="Number of content safety blocks triggered",
        )
        self.errors = Counter(
            name="errors_total",
            description="Total errors across all services",
        )
        self.api_calls = Counter(
            name="api_calls_total",
            description="Total external API calls (Gemini, Imagen, TTS)",
        )

        # Histograms
        self.tool_duration = Histogram(
            name="tool_duration_seconds",
            description="Duration of tool invocations in seconds",
        )
        self.api_latency = Histogram(
            name="api_latency_seconds",
            description="External API call latency in seconds",
        )
        self.page_text_length = Histogram(
            name="page_text_length_chars",
            description="Length of generated page text in characters",
        )

        # Gauges
        self.active_sessions = Gauge(
            name="active_sessions",
            description="Number of active story sessions",
        )
        self.active_websockets = Gauge(
            name="active_websockets",
            description="Number of active WebSocket connections",
        )

        self._start_time = time.time()

    def snapshot(self) -> dict[str, Any]:
        """Return complete metrics snapshot as a dict."""
        return {
            "uptime_seconds": round(time.time() - self._start_time, 2),
            "counters": {
                "tool_calls_total": self.tool_calls_total.snapshot(),
                "pages_generated": self.pages_generated.snapshot(),
                "safety_blocks": self.safety_blocks.snapshot(),
                "errors_total": self.errors.snapshot(),
                "api_calls_total": self.api_calls.snapshot(),
            },
            "histograms": {
                "tool_duration_seconds": self.tool_duration.snapshot(),
                "api_latency_seconds": self.api_latency.snapshot(),
                "page_text_length_chars": self.page_text_length.snapshot(),
            },
            "gauges": {
                "active_sessions": self.active_sessions.snapshot(),
                "active_websockets": self.active_websockets.snapshot(),
            },
        }
