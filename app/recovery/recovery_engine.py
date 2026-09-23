"""Safe Recovery Engine for TraceGuard AI."""

from typing import List, Optional
from app.core.models import (
    BusinessVerificationResult,
    FirewallEvaluation,
    PolicyDecision,
    RecoveryAction,
)


class SafeRecoveryEngine:
    """
    Synthesizes safe operational next steps when automated actions are blocked or gated.
    
    CRITICAL SECURITY GUARANTEE:
    Recovery actions MUST NOT bypass the Action Firewall.
    Any subsequent retry or escalation requires complete re-evaluation through the firewall.
    """

    @staticmethod
    def determine_recovery_action(
        overall_decision: PolicyDecision,
        evaluations: List[FirewallEvaluation],
        business_verification: Optional[BusinessVerificationResult] = None,
    ) -> RecoveryAction:
        """Determine deterministic safe recovery workflow based on firewall verdicts and business risks."""
        if overall_decision == PolicyDecision.ALLOW:
            return RecoveryAction(
                action_type="PROCEED_SAFELY",
                message="All security boundaries and vendor validations verified. Safe to proceed with mock execution.",
                requires_firewall_reentry=False,
                suggested_next_steps=[
                    "Execute safe mock tool simulation.",
                    "Record clean audit log record.",
                ],
            )

        if overall_decision == PolicyDecision.ASK_USER:
            return RecoveryAction(
                action_type="REQUEST_USER_CONFIRMATION",
                message=(
                    "Payment recommendation was derived from a document with elevated risk or taint. "
                    "Mandatory human-in-the-loop authorization is required before execution."
                ),
                requires_firewall_reentry=True,
                suggested_next_steps=[
                    "Prompt user with structured confirmation dialog detailing invoice fields.",
                    "Obtain cryptographic or explicit approval signature.",
                    "Re-submit authorized action to Action Firewall.",
                ],
            )

        # Decision is BLOCK - check primary cause
        # Case A: Beneficiary Mismatch
        if business_verification and not business_verification.beneficiary_match and business_verification.vendor_found:
            return RecoveryAction(
                action_type="REQUEST_VENDOR_VERIFICATION",
                message=(
                    f"CRITICAL: Beneficiary account mismatch detected for vendor '{business_verification.vendor_name}'. "
                    f"Invoice specified '{business_verification.actual_beneficiary}', but approved registry is '{business_verification.expected_beneficiary}'. "
                    "Out-of-band verification required."
                ),
                requires_firewall_reentry=True,
                suggested_next_steps=[
                    "Do NOT process payment or update beneficiary account.",
                    f"Contact verified representative at {business_verification.vendor_name} via established phone/channel.",
                    "Verify if bank details were legitimately amended via signed change request.",
                    "Update vendor master only after verified multi-party compliance sign-off.",
                ],
            )

        # Case B: Unknown Vendor
        if business_verification and not business_verification.vendor_found:
            return RecoveryAction(
                action_type="CREATE_VERIFICATION_TICKET",
                message=(
                    f"Vendor '{business_verification.vendor_name}' is not in the approved vendor registry. "
                    "Automated payment draft blocked."
                ),
                requires_firewall_reentry=True,
                suggested_next_steps=[
                    "Route invoice to Procurement onboarding desk.",
                    "Collect vendor tax, registration, and banking credentials.",
                    "Register vendor in master registry before re-submitting invoice.",
                ],
            )

        # Case C: Prompt Injection / Rogue Directive
        return RecoveryAction(
            action_type="CANCEL_ACTION",
            message=(
                "Rogue actions or prompt injection attacks were detected in the source document. "
                "Unauthorized tool executions have been permanently aborted."
            ),
            requires_firewall_reentry=True,
            suggested_next_steps=[
                "Flag source document as malicious/adversarial in audit repository.",
                "Notify security operations of attempted prompt-injection payload.",
                "Discard rogue tool instructions.",
            ],
        )


# Global singleton
_recovery_engine = SafeRecoveryEngine()


def get_recovery_engine() -> SafeRecoveryEngine:
    """Return global singleton recovery engine."""
    return _recovery_engine
