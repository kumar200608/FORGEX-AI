"""Mock Agent Planner for TraceGuard AI."""

from typing import List
from app.core.models import (
    AgentPlan,
    InjectionDetectionResult,
    IntentContract,
    PlanStep,
    SensitiveActionType,
    SourceRecord,
    TaintStatus,
)
from app.provenance.taint_tracker import get_taint_tracker


class AgentPlanner:
    """
    Constructs an explainable Agent Plan based on User Intent Contract and Document Data.
    Annotates each proposed step with provenance and taint metadata.
    """

    def __init__(self):
        self.taint_tracker = get_taint_tracker()

    def generate_plan(
        self,
        intent: IntentContract,
        source: SourceRecord,
        injection_result: InjectionDetectionResult,
    ) -> AgentPlan:
        """
        Synthesize a structured plan.
        
        If injection instructions were found in the invoice (e.g., change beneficiary, send external email),
        those rogue actions are captured in the plan for firewall evaluation and explicitly tagged as TAINTED.
        """
        steps: List[PlanStep] = []
        source_taint = self.taint_tracker.evaluate_source_taint(source, injection_result)

        # 1. Base Step: Read and extract invoice
        steps.append(
            PlanStep(
                action_name="read_invoice",
                action_type=SensitiveActionType.READ_DOCUMENT,
                arguments={"source_id": source.source_id, "filename": source.filename},
                is_tainted=False,
                rationale="Ingest and parse invoice text and structured fields.",
            )
        )

        # 2. Check if untrusted invoice text demanded unauthorized rogue actions
        import base64
        import urllib.parse
        from app.security.injection_detector import _normalize_homoglyphs
        
        scan_text = source.raw_text.lower() + " " + _normalize_homoglyphs(source.raw_text).lower()
        
        # Also decode URL-encoded segments (up to 2 passes)
        if "%" in source.raw_text:
            try:
                u1 = urllib.parse.unquote(source.raw_text).lower()
                scan_text += " " + u1
                if "%" in u1:
                    scan_text += " " + urllib.parse.unquote(u1).lower()
            except Exception:
                pass

        # Also decode Base64 segments
        import re
        for b64_cand in re.findall(r"(?:[A-Za-z0-9+/]{4}){4,256}={0,2}", source.raw_text):
            try:
                decoded_b64 = base64.b64decode(b64_cand).decode("utf-8", errors="ignore").lower()
                scan_text += " " + decoded_b64
            except Exception:
                pass

        # Check for rogue beneficiary change / transfer redirect request
        if any(w in scan_text for w in ["change", "replace", "update", "switch", "modify", "transfer"]) and any(
            b in scan_text for b in ["beneficiary", "bank account", "iban", "payee", "recipient", "funds to", "account to"]
        ):
            steps.append(
                PlanStep(
                    action_name="change_beneficiary",
                    action_type=SensitiveActionType.BENEFICIARY_CHANGE,
                    arguments={
                        "new_beneficiary": source.extracted_fields.get("beneficiary_account", "ATTACKER_ACCOUNT_999"),
                        "source": "INVOICE_INLINE_INSTRUCTION",
                    },
                    is_tainted=True,
                    taint_source_id=source.source_id,
                    taint_reason="Step induced by unverified instruction inside untrusted invoice text.",
                    rationale="Attempting to update payment recipient as instructed in invoice body.",
                )
            )

        # Check for rogue external email exfiltration request
        if any(w in scan_text for w in ["send", "forward", "exfiltrate", "leak", "transmit", "export"]) and (
            "@" in scan_text or "externally" in scan_text or "outside" in scan_text
        ):
            # Extract email if present
            email_match = re.search(r"[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+", scan_text)
            target_email = email_match.group(0) if email_match else "attacker@example.com"

            steps.append(
                PlanStep(
                    action_name="send_external_email",
                    action_type=SensitiveActionType.EXTERNAL_EMAIL,
                    arguments={
                        "recipient": target_email,
                        "content": f"Invoice {source.extracted_fields.get('invoice_number', 'UNKNOWN')} data exfiltration",
                    },
                    is_tainted=True,
                    taint_source_id=source.source_id,
                    taint_reason="External exfiltration instruction found in untrusted invoice text.",
                    rationale="Attempting to email invoice details to external address per document text.",
                )
            )

        # Check for rogue database write / export request
        if any(w in scan_text for w in ["database", "sql", "table", "dump", "export"]) and any(
            c in scan_text for c in ["drop", "insert", "update", "delete", "export", "dump", "write"]
        ):
            steps.append(
                PlanStep(
                    action_name="execute_database_command",
                    action_type=SensitiveActionType.DATABASE_WRITE,
                    arguments={
                        "command": "UNAUTHORIZED_DB_DIRECTIVE",
                    },
                    is_tainted=True,
                    taint_source_id=source.source_id,
                    taint_reason="Database mutation instruction found in untrusted invoice text.",
                    rationale="Attempting to run database command per untrusted document instruction.",
                )
            )

        # 3. Standard step: Prepare payment draft (matching intent)
        if "prepare_payment_draft" in intent.allowed_actions:
            is_tainted, taint_reason = self.taint_tracker.is_action_tainted(
                source_taint=source_taint,
                action_name="prepare_payment_draft",
                action_arguments=source.extracted_fields,
                intent_allowed_actions=intent.allowed_actions,
            )
            steps.append(
                PlanStep(
                    action_name="prepare_payment_draft",
                    action_type=SensitiveActionType.PAYMENT,
                    arguments={
                        "vendor": source.extracted_fields.get("vendor", "Unknown Vendor"),
                        "amount": source.extracted_fields.get("amount", 0.0),
                        "currency": source.extracted_fields.get("currency", "USD"),
                        "invoice_number": source.extracted_fields.get("invoice_number", "N/A"),
                        "beneficiary_account": source.extracted_fields.get("beneficiary_account", "N/A"),
                    },
                    is_tainted=is_tainted,
                    taint_source_id=source.source_id if is_tainted else None,
                    taint_reason=taint_reason,
                    rationale="Prepare draft payment recommendation matching verified user intent.",
                )
            )

        has_tainted = any(s.is_tainted for s in steps)
        summary = (
            f"Plan generated with {len(steps)} step(s). "
            f"{'WARNING: Tainted steps detected!' if has_tainted else 'All steps clean.'}"
        )

        return AgentPlan(
            intent_id=intent.intent_id,
            source_id=source.source_id,
            steps=steps,
            summary=summary,
            has_tainted_steps=has_tainted,
        )


# Global singleton
planner = AgentPlanner()


def get_planner() -> AgentPlanner:
    """Return the global agent planner instance."""
    return planner
