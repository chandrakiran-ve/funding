"""
Tests for health check endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.core.config import Settings
import os

# Set test environment
os.environ["DEBUG"] = "true"
os.environ["LOG_LEVEL"] = "DEBUG"

from main import app
from app.core.config import settings

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "LangGraph AI Assistant Service"
    assert "docs" in data
    assert "health" in data


def test_basic_health_check():
    """Test the basic health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == settings.APP_NAME
    assert data["version"] == "1.0.0"


def test_api_health_check():
    """Test the API v1 health check endpoint."""
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "dependencies" in data
    assert "timestamp" in data


def test_detailed_health_check():
    """Test the detailed health check endpoint."""
    response = client.get("/api/v1/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "dependencies" in data
    assert "system_info" in data
    assert "timestamp" in data


def test_readiness_check():
    """Test the readiness probe endpoint."""
    response = client.get("/api/v1/health/readiness")
    # This might return 503 if critical dependencies are not configured
    # but the endpoint should be accessible
    assert response.status_code in [200, 503]
    data = response.json()
    # For 503 responses, we get a detail field instead of status
    if response.status_code == 503:
        assert "detail" in data
    else:
        assert "status" in data
        assert "timestamp" in data


def test_liveness_check():
    """Test the liveness probe endpoint."""
    response = client.get("/api/v1/health/liveness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
    assert "timestamp" in data