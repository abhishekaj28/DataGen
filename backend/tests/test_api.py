import pytest
from fastapi.testclient import TestClient

from backend import main
from backend.generator import LLMProviderError

client = TestClient(main.app)

BODY = {"task_type": "classification", "domain": "customer reviews", "num_samples": 5,
        "labels": ["positive", "negative", "neutral"]}


def test_root_is_up():
    assert client.get("/").json()["status"].startswith("DataGen Framework is running")


def test_without_api_key_returns_labelled_mock_data():
    r = client.post("/generate", json=BODY)
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "mock"
    assert data["total_generated"] == 5
    assert "label_distribution" in data["stats"]


def test_provider_failure_is_a_502_with_the_reason(monkeypatch):
    async def boom(req):
        raise LLMProviderError("gemini request failed: API key not valid")

    monkeypatch.setattr(main, "generate_samples", boom)
    r = client.post("/generate", json={**BODY, "api_key": "bad", "llm_provider": "gemini"})
    assert r.status_code == 502
    assert "API key not valid" in r.json()["detail"]


def test_unknown_provider_is_rejected_not_mocked():
    r = client.post("/generate", json={**BODY, "api_key": "x", "llm_provider": "nope"})
    assert r.status_code == 502
    assert "Unknown llm_provider" in r.json()["detail"]


def test_num_samples_is_bounded():
    r = client.post("/generate", json={**BODY, "num_samples": 500})
    assert r.status_code == 422


def test_redact_pii_flag_is_applied(monkeypatch):
    from backend.models import DataSample

    async def fake(req):
        return [DataSample(id=1, input="Reach me at jane@example.com about the order", output="neutral")], "llm", "gemini"

    monkeypatch.setattr(main, "generate_samples", fake)
    body = {**BODY, "num_samples": 1, "api_key": "k", "llm_provider": "gemini", "redact_pii": True}
    data = client.post("/generate", json=body).json()
    assert "jane@example.com" not in data["samples"][0]["input"]
    assert data["stats"]["pii_redacted_count"] == 1
    assert "diversity" in data["stats"]
