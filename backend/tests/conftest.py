"""Shared test configuration and fixtures."""

import pytest


# Allow pytest-asyncio to auto-detect async tests
def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "asyncio: async test")
