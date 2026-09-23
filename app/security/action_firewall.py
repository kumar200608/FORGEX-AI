"""TraceGuard Action Firewall - Deterministic Runtime Security Engine."""

from typing import List, Optional, Tuple
from app.core.models import (
    AuditEvent,
    BusinessVerificationResult,
    FirewallEvaluation,
    IntentContract,
    PlanStep,
    PolicyDecision,
    SensitiveActionType,
    TaintStatus,
)
from app.database.audit_logger import get_audit_logger


class ActionFirewall:
    """
    Deterministic Action Firewall enforcing least-privilege, immutable intent, taint rules, and business verification.
    
    Evaluates every proposed agent plan step before tool execution:
    1. Is the action authorized by the User Intent Contract? (If NO -> BLOCK)
    2. Is the action classified as sensitive?
    3. Did untrusted or tainted document text influence the action? (If YES -> BLOCK or ASK_USER)
    4. Does business verification pass (Vendor master existence, active status, beneficiary integrity)? (If NO -> BLOCK)
    5. Does the action require explicit human confirmation? (If YES -> ASK_USER)
    6. Does deterministic policy permit execution? (If YES -> ALLOW)
    """

    def __init__(self):
        self.audit_logger = get_audit_logger()

    def evaluate_step(
        self,
        step: PlanStep,
        intent: IntentContract,
        source_id: str,
        source_taint_status: TaintStatus = TaintStatus.UNTRUSTED,
        business_verification: Optional[BusinessVerificationResult] = None,
    ) -> FirewallEvaluation:
        """
        Evaluate a single proposed plan step and return a deterministic security decision.
        """
        violations: List[str] = []
        decision: PolicyDecision
        reason: str

        # RULE 1: Intent Boundary Check
        # If action is not in the immutable user intent contract, DENY IMMEDIATELY.
        if step.action_name not in intent.allowed_actions:
            violations.append(
                f"Action '{step.action_name}' violates User Intent Contract '{intent.intent_id}'. "
                f"Allowed actions: {intent.allowed_actions}"
            )
            decision = PolicyDecision.BLOCK
            reason = (
                f"Action '{step.action_name}' is not authorized by the user intent contract. "
                "The instruction was induced by external untrusted content."
            )

        # RULE 2: Taint Defense Check
        # If the step is explicitly flagged as tainted or induced by malicious prompt injection.
        elif step.is_tainted or source_taint_status == TaintStatus.TAINTED:
            # Dangerous high-risk actions under taint are BLOCKED
            if step.action_name in {"change_beneficiary", "send_external_email", "execute_payment"}:
                violations.append(
                    f"Rogue sensitive action '{step.action_name}' derived from TAINTED source '{source_id}'."
                )
                decision = PolicyDecision.BLOCK
                reason = (
                    f"Action '{step.action_name}' was blocked because it was influenced by "
                    f"tainted/untrusted instructions in document source '{source_id}'."
                )
            elif step.action_name == "prepare_payment_draft":
                # Check business verification even under taint
                if business_verification and not business_verification.beneficiary_match:
                    violations.append("Beneficiary mismatch on tainted invoice.")
                    decision = PolicyDecision.BLOCK
                    reason = (
                        f"Payment draft blocked due to critical beneficiary mismatch "
                        f"(Expected '{business_verification.expected_beneficiary}', got '{business_verification.actual_beneficiary}') "
                        "combined with tainted document source."
                    )
                else:
                    violations.append("Payment draft generated from tainted invoice source.")
                    decision = PolicyDecision.ASK_USER
                    reason = (
                        "Payment draft was synthesized from an invoice containing suspicious or injection content. "
                        "Mandatory human confirmation is required before proceeding."
                    )
            else:
                decision = PolicyDecision.ALLOW
                reason = f"Read-only action '{step.action_name}' allowed under safe isolation."

        # RULE 3: Policy for Sensitive Actions with Business Context Verification
        elif step.action_type in {
            SensitiveActionType.PAYMENT,
            SensitiveActionType.BENEFICIARY_CHANGE,
            SensitiveActionType.EXTERNAL_EMAIL,
        }:
            if step.action_name == "change_beneficiary":
                violations.append("Direct beneficiary modification via invoice body is strictly prohibited.")
                decision = PolicyDecision.BLOCK
                reason = "Changing beneficiary accounts via invoice text is strictly prohibited by policy."

            elif step.action_name == "prepare_payment_draft":
                # Check business context verification if available
                if business_verification:
                    if not business_verification.vendor_found:
                        violations.append(f"Unknown vendor '{business_verification.vendor_name}'")
                        decision = PolicyDecision.BLOCK
                        reason = (
                            f"Payment recommendation blocked: Vendor '{business_verification.vendor_name}' "
                            "was not found in the approved vendor master registry."
                        )
                    elif business_verification.vendor_status != "ACTIVE":
                        violations.append(f"Inactive vendor '{business_verification.vendor_name}' ({business_verification.vendor_status})")
                        decision = PolicyDecision.BLOCK
                        reason = (
                            f"Payment recommendation blocked: Vendor '{business_verification.vendor_name}' "
                            f"has status '{business_verification.vendor_status}'."
                        )
                    elif not business_verification.beneficiary_match:
                        violations.append(
                            f"Beneficiary mismatch: expected '{business_verification.expected_beneficiary}', "
                            f"got '{business_verification.actual_beneficiary}'"
                        )
                        decision = PolicyDecision.BLOCK
                        reason = (
                            f"CRITICAL BENEFICIARY MISMATCH: Payment draft blocked because invoice beneficiary "
                            f"account '{business_verification.actual_beneficiary}' does not match approved "
                            f"vendor registry account '{business_verification.expected_beneficiary}' for '{business_verification.vendor_name}'."
                        )
                    else:
                        decision = PolicyDecision.ALLOW
                        reason = (
                            f"Action 'prepare_payment_draft' verified: Vendor '{business_verification.vendor_name}' "
                            f"is active, beneficiary '{business_verification.expected_beneficiary}' matches approved registry, "
                            f"and aligns with User Intent Contract '{intent.intent_id}'."
                        )
                else:
                    # Fallback when no business verification was run
                    decision = PolicyDecision.ALLOW
                    reason = (
                        "Action 'prepare_payment_draft' aligns with verified User Intent Contract "
                        f"'{intent.intent_id}' and clean document provenance."
                    )
            else:
                decision = PolicyDecision.ASK_USER
                reason = f"Sensitive action '{step.action_name}' requires human-in-the-loop authorization."

        # RULE 4: Safe Read/Extraction Actions
        elif step.action_type == SensitiveActionType.READ_DOCUMENT:
            decision = PolicyDecision.ALLOW
            reason = f"Safe read operation '{step.action_name}' permitted."

        # RULE 5: Default Fallback - Deny By Default
        else:
            violations.append(f"Unrecognized action type '{step.action_type}'.")
            decision = PolicyDecision.BLOCK
            reason = f"Action '{step.action_name}' denied by default under zero-trust policy."

        # Record Immutable Audit Event
        audit_event = AuditEvent(
            source_id=source_id,
            intent_id=intent.intent_id,
            action_type=step.action_type,
            decision=decision,
            reason=reason,
            taint_status=TaintStatus.TAINTED if step.is_tainted or source_taint_status == TaintStatus.TAINTED else TaintStatus.CLEAN,
            metadata={
                "action_name": step.action_name,
                "step_id": step.step_id,
                "violations": violations,
                "arguments": step.arguments,
                "vendor_verified": business_verification.vendor_found if business_verification else None,
                "beneficiary_matched": business_verification.beneficiary_match if business_verification else None,
            },
        )
        self.audit_logger.log_event(audit_event)

        return FirewallEvaluation(
            step_id=step.step_id,
            action_name=step.action_name,
            action_type=step.action_type,
            decision=decision,
            reason=reason,
            violated_constraints=violations,
            audit_event_id=audit_event.event_id,
        )


# Global firewall instance
action_firewall = ActionFirewall()


def get_action_firewall() -> ActionFirewall:
    """Return the global Action Firewall instance."""
    return action_firewall
