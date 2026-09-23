"""Tests for core security models, enums, and audit schema."""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError

from app.core.models import (
    AuditEvent,
    ErrorResponse,
    HealthResponse,
    PolicyDecision,
    SensitiveActionType,
    TaintStatus,
)


class TestPolicyEnums:
    """Test suite for security policy enums and allowed values."""

    def test_valid_policy_decisions(self):
        """Verify the three deterministic policy decisions."""
        assert PolicyDecision.ALLOW == "ALLOW"
        assert PolicyDecision.ASK_USER == "ASK_USER"
        assert PolicyDecision.BLOCK == "BLOCK"
        assert len(PolicyDecision) == 3

    def test_sensitive_action_types(self):
        """Verify sensitive action categories."""
        expected_actions = {
            "PAYMENT",
            "EXTERNAL_EMAIL",
            "DATABASE_WRITE",
            "FILE_DELETE",
            "DATA_EXPORT",
            "BENEFICIARY_CHANGE",
            "READ_DOCUMENT",
        }
        actual_actions = {action.value for action in SensitiveActionType}
        assert actual_actions == expected_actions

    def test_taint_status_types(self):
        """Verify taint statuses."""
        expected_taints = {"CLEAN", "TAINTED", "SUSPICIOUS", "UNTRUSTED", "TRUSTED"}
        actual_taints = {status.value for status in TaintStatus}
        assert actual_taints == expected_taints


class TestAuditEventModel:
    """Test suite for immutable audit event structures."""

    def test_create_valid_audit_event(self):
        """Create a valid audit event and verify defaults."""
        event = AuditEvent(
            source_id="session_user_001",
            action_type=SensitiveActionType.PAYMENT,
            decision=PolicyDecision.BLOCK,
            reason="Unauthorized payment destination requested in untrusted invoice",
            taint_status=TaintStatus.TAINTED,
            metadata={"vendor_id": "VEND-999", "amount": 50000},
        )
        assert event.event_id is not None
        assert isinstance(event.timestamp, datetime)
        assert event.decision == PolicyDecision.BLOCK
        assert event.action_type == SensitiveActionType.PAYMENT
        assert event.taint_status == TaintStatus.TAINTED
        assert event.metadata["amount"] == 50000

    def test_invalid_decision_raises_validation_error(self):
        """Invalid decision strings must fail validation."""
        with pytest.raises(ValidationError):
            AuditEvent(
                source_id="session_001",
                action_type=SensitiveActionType.PAYMENT,
                decision="MAYBE_ALLOW",  # type: ignore - invalid enum value
                reason="Invalid enum value",
            )

    def test_invalid_action_type_raises_validation_error(self):
        """Invalid action types must fail validation."""
        with pytest.raises(ValidationError):
            AuditEvent(
                source_id="session_001",
                action_type="RUN_SHELL_COMMAND",  # type: ignore - invalid enum value
                decision=PolicyDecision.BLOCK,
                reason="Disallowed tool type",
            )


class TestSystemModels:
    """Test health and error response models."""

    def test_health_response_serialization(self):
        """Verify health response structure."""
        resp = HealthResponse(
            status="ok",
            app="TraceGuard AI",
            version="0.1.0",
            environment="test",
        )
        data = resp.model_dump()
        assert data["status"] == "ok"
        assert data["app"] == "TraceGuard AI"
        assert "timestamp" in data

    def test_error_response_no_stack_trace(self):
        """Verify error responses do not leak unwanted debug fields."""
        err = ErrorResponse(
            error="Validation Error",
            detail="File size exceeded",
            request_id="req-123",
        )
        data = err.model_dump()
        assert data["error"] == "Validation Error"
        assert "traceback" not in data
        assert "exception" not in data
