"""Tests for the API health check and service discovery endpoints."""

from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Verify that GET /health returns 200 OK and valid health metadata."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert "app" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


def test_root_endpoint(client: TestClient):
    """Verify that GET / returns root service information."""
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["app"] == "TraceGuard AI"
    assert data["hackathon"] == "FORGEX AI 2026"
    assert data["problem_statement"] == "AI-2 — Indirect Prompt-Injection Firewall for Tool-Using Agents"
    assert data["team"] == "INNVOX"
