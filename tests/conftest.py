"""Pytest fixtures and test client configuration."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import app


@pytest.fixture
def test_settings() -> Settings:
    """Return isolated test settings."""
    return Settings(
        APP_NAME="TraceGuard AI Test",
        APP_VERSION="0.1.0",
        ENVIRONMENT="test",
        DEBUG=False,
        MAX_UPLOAD_SIZE_BYTES=1024 * 1024,  # 1 MB for testing
    )


@pytest.fixture
def client(test_settings: Settings) -> TestClient:
    """Provide a FastAPI TestClient instance with test settings overridden."""
    app.dependency_overrides[get_settings] = lambda: test_settings
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
