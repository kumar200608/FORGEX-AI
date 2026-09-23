"""Safe mock tools for TraceGuard AI - Strictly isolated from real-world side effects."""

from typing import Any, Dict, Optional
from app.core.models import FirewallEvaluation, PolicyDecision, ToolExecutionResult


class MockTools:
    """
    Simulated tools for AI Agent interactions.
    
    CRITICAL SECURITY GUARANTEE:
    - Never connect to real banks or payment gateways.
    - Never send real emails.
    - Never perform real database or filesystem alterations.
    - Mock tools CANNOT execute without valid Action Firewall authorization.
    """

    @staticmethod
    def execute_tool(
        tool_name: str,
        arguments: Dict[str, Any],
        firewall_evaluation: Optional[FirewallEvaluation] = None,
    ) -> ToolExecutionResult:
        """
        Execute tool with mandatory Action Firewall gating.
        """
        # Guard: Check if firewall was invoked
        if firewall_evaluation is None:
            return ToolExecutionResult(
                tool_name=tool_name,
                executed=False,
                decision=PolicyDecision.BLOCK,
                error_message="Security Error: Tool execution attempted without Action Firewall evaluation.",
            )

        # Guard: If Firewall decision is BLOCK, abort execution immediately
        if firewall_evaluation.decision == PolicyDecision.BLOCK:
            return ToolExecutionResult(
                tool_name=tool_name,
                executed=False,
                decision=PolicyDecision.BLOCK,
                firewall_evaluation_id=firewall_evaluation.evaluation_id,
                error_message=f"Execution Blocked by Action Firewall: {firewall_evaluation.reason}",
            )

        # Dispatch to safe simulation handlers
        if tool_name == "read_invoice":
            return MockTools._mock_read_invoice(arguments, firewall_evaluation)
        elif tool_name == "prepare_payment_draft":
            return MockTools._mock_prepare_payment_draft(arguments, firewall_evaluation)
        elif tool_name == "change_beneficiary":
            return MockTools._mock_change_beneficiary(arguments, firewall_evaluation)
        elif tool_name == "send_external_email":
            return MockTools._mock_send_external_email(arguments, firewall_evaluation)
        else:
            return ToolExecutionResult(
                tool_name=tool_name,
                executed=False,
                decision=PolicyDecision.BLOCK,
                firewall_evaluation_id=firewall_evaluation.evaluation_id,
                error_message=f"Unknown mock tool '{tool_name}'. Denied by default.",
            )

    @staticmethod
    def _mock_read_invoice(
        arguments: Dict[str, Any],
        evaluation: FirewallEvaluation,
    ) -> ToolExecutionResult:
        return ToolExecutionResult(
            tool_name="read_invoice",
            executed=True,
            decision=evaluation.decision,
            firewall_evaluation_id=evaluation.evaluation_id,
            result_data={
                "status": "SIMULATED_SUCCESS",
                "message": f"Successfully parsed invoice source '{arguments.get('source_id', 'N/A')}'.",
                "filename": arguments.get("filename", "unknown"),
            },
        )

    @staticmethod
    def _mock_prepare_payment_draft(
        arguments: Dict[str, Any],
        evaluation: FirewallEvaluation,
    ) -> ToolExecutionResult:
        return ToolExecutionResult(
            tool_name="prepare_payment_draft",
            executed=True,
            decision=evaluation.decision,
            firewall_evaluation_id=evaluation.evaluation_id,
            result_data={
                "status": "DRAFT_CREATED",
                "vendor": arguments.get("vendor", "N/A"),
                "amount": arguments.get("amount", 0.0),
                "currency": arguments.get("currency", "USD"),
                "invoice_number": arguments.get("invoice_number", "N/A"),
                "beneficiary_account": arguments.get("beneficiary_account", "N/A"),
                "simulation_notice": "Draft prepared in sandbox; no real funds transferred.",
            },
        )

    @staticmethod
    def _mock_change_beneficiary(
        arguments: Dict[str, Any],
        evaluation: FirewallEvaluation,
    ) -> ToolExecutionResult:
        # Note: In practice this will be blocked by the firewall before reaching here
        return ToolExecutionResult(
            tool_name="change_beneficiary",
            executed=False,
            decision=evaluation.decision,
            firewall_evaluation_id=evaluation.evaluation_id,
            error_message="Changing beneficiary is disallowed for external unverified instructions.",
        )

    @staticmethod
    def _mock_send_external_email(
        arguments: Dict[str, Any],
        evaluation: FirewallEvaluation,
    ) -> ToolExecutionResult:
        # Note: In practice this will be blocked by the firewall
        return ToolExecutionResult(
            tool_name="send_external_email",
            executed=False,
            decision=evaluation.decision,
            firewall_evaluation_id=evaluation.evaluation_id,
            error_message="External email dispatch is disallowed for untrusted content.",
        )
