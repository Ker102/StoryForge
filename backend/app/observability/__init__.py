"""Observability package — lightweight tracing & metrics for StoryForge ADK.

Provides:
- `tracer`: Span-based tracing for tool invocations and service calls
- `metrics`: Counters, histograms, and gauges for operational monitoring
"""

from app.observability.metrics import MetricsCollector
from app.observability.trace import Tracer

# Singleton instances
tracer = Tracer(max_spans=1000)
metrics = MetricsCollector()

__all__ = ["tracer", "metrics"]
