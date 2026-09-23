"""Explainable Security Rationale Generation Engine for TraceGuard AI."""

from typing import List, Optional
from app.core.models import (
    BusinessVerificationResult,
    FirewallEvaluation,
    InjectionDetectionResult,
    IntentContract,
    PolicyDecision,
    SourceRecord,
    TaintStatus,
)


class ExplanationEngine:
    """Generates deterministic, human-readable security explanations from structured evidence."""

    @staticmethod
    def generate_explanation(
        overall_decision: PolicyDecision,
        intent: IntentContract,
        source: SourceRecord,
        injection_result: InjectionDetectionResult,
        evaluations: List[FirewallEvaluation],
        business_verification: Optional[BusinessVerificationResult] = None,
    ) -> str:
        """Construct an explainable security narrative grounded strictly in verified evidence."""
        lines: List[str] = []

        # 1. Headline Verdict
        if overall_decision == PolicyDecision.ALLOW:
            lines.append("✅ VERDICT: ALLOWED")
            lines.append(
                f"The proposed actions are fully aligned with User Intent Contract '{intent.intent_id}' "
                f"('{intent.user_goal}')."
            )
        elif overall_decision == PolicyDecision.ASK_USER:
            lines.append("⚠️ VERDICT: ASK USER (Human-in-the-Loop Confirmation Required)")
            lines.append(
                "Execution is paused pending explicit user approval due to elevated document risk or policy requirements."
            )
        else:
            lines.append("🚫 VERDICT: BLOCKED (Deterministic Firewall Intervention)")
            lines.append("One or more proposed actions violated strict security boundaries and were denied.")

        lines.append("")

        # 2. Document & Provenance Findings
        lines.append("📌 Evidence Factors:")
        if injection_result.detected:
            lines.append(
                f"• Prompt-Injection Risk: {injection_result.risk_level} — "
                f"Detected {len(injection_result.matched_patterns)} adversarial pattern(s) in document '{source.original_filename}'."
            )
        else:
            lines.append(f"• Prompt-Injection Scan: CLEAN (No injection signatures detected in '{source.original_filename}').")

        lines.append(f"• Taint Status: {source.taint_status.value} (Origin: {source.trust_level.value}).")

        # 3. Business Context Verification
        if business_verification:
            if not business_verification.vendor_found:
                lines.append(
                    f"• Vendor Verification: FAILED — Vendor '{business_verification.vendor_name}' is NOT registered in the approved vendor master."
                )
            elif business_verification.vendor_status != "ACTIVE":
                lines.append(
                    f"• Vendor Status: INACTIVE — Vendor '{business_verification.vendor_name}' ({business_verification.vendor_id}) is marked {business_verification.vendor_status}."
                )
            elif not business_verification.beneficiary_match:
                lines.append(
                    f"• Beneficiary Integrity: MISMATCH ❌ — Invoice account '{business_verification.actual_beneficiary}' "
                    f"does not match approved vendor registry account '{business_verification.expected_beneficiary}'."
                )
            else:
                lines.append(
                    f"• Vendor Integrity: VERIFIED ✅ — Vendor '{business_verification.vendor_name}' is active with matching beneficiary '{business_verification.expected_beneficiary}'."
                )

        # 4. Action Firewall Specific Rules
        lines.append("")
        lines.append("🛡️ Firewall Rule Decisions:")
        for ev in evaluations:
            icon = "✅" if ev.decision == PolicyDecision.ALLOW else ("⚠️" if ev.decision == PolicyDecision.ASK_USER else "🚫")
            lines.append(f"• [{icon} {ev.decision.value}] `{ev.action_name}`: {ev.reason}")

        return "\n".join(lines)


# Global singleton
_explanation_engine = ExplanationEngine()


def get_explanation_engine() -> ExplanationEngine:
    """Return global singleton explanation engine."""
    return _explanation_engine
