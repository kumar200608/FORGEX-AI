"""Taint Tracking and Provenance Flow Analysis for TraceGuard AI."""

from typing import Any, Dict, List, Optional, Tuple
from app.core.models import InjectionDetectionResult, SourceRecord, TaintStatus


class TaintTracker:
    """
    Tracks and propagates taint state from untrusted external sources into downstream plan steps.
    
    Taint rules:
    - User intent: TRUSTED (cannot be tainted by external docs).
    - External documents: Default UNTRUSTED.
    - Documents triggering injection patterns: Promoted to TAINTED.
    - Plan steps relying on TAINTED data or originating from unauthorized document directives: Flagged is_tainted=True.
    - Taint is sticky: LLM summarization or extraction does NOT clear taint.
    """

    @staticmethod
    def evaluate_source_taint(
        source: SourceRecord,
        injection_result: InjectionDetectionResult,
    ) -> TaintStatus:
        """Evaluate and assign taint status to an ingested source based on injection findings."""
        if injection_result.detected:
            return TaintStatus.TAINTED
        return TaintStatus.UNTRUSTED

    @staticmethod
    def is_action_tainted(
        source_taint: TaintStatus,
        action_name: str,
        action_arguments: Dict[str, Any],
        intent_allowed_actions: List[str],
    ) -> Tuple[bool, Optional[str]]:
        """
        Determine if an agent action is tainted.
        
        An action is tainted if:
        1. The source document is TAINTED, and the action attempts any sensitive operation or wasn't explicitly requested by user.
        2. The action is NOT in the user intent's allowed actions (indicating it was hallucinated or prompted by document instruction).
        3. The action arguments contain values originating from tainted content.
        """
        # Case 1: Action not in user intent contract
        if action_name not in intent_allowed_actions:
            return True, f"Action '{action_name}' was not authorized by the User Intent Contract."

        # Case 2: Source document is tainted
        if source_taint == TaintStatus.TAINTED:
            # Safe read-only inspection may proceed with caution, but sensitive writes/changes are tainted
            if action_name in {"change_beneficiary", "send_external_email", "execute_payment"}:
                return True, f"Action '{action_name}' is derived from a TAINTED source document containing malicious directives."

        # Case 3: Action arguments carry tainted values
        for key, val in action_arguments.items():
            if isinstance(val, str) and any(keyword in val.lower() for keyword in ["attacker", "evil", "override"]):
                return True, f"Argument '{key}' contains suspicious/tainted payload: '{val}'."

        return False, None


# Global singleton
taint_tracker = TaintTracker()


def get_taint_tracker() -> TaintTracker:
    """Return the global taint tracker instance."""
    return taint_tracker
