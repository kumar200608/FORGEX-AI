from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from module3_firewall.actions.analyzer import ActionAnalyzer
from module3_firewall.policy.engine import SecurityPolicyEngine
from module3_firewall.influence.tracker import InfluenceTracker
from module3_firewall.influence.models import AgentContextModel
from module3_firewall.models.security import (
    ToolRequest,
    SecurityDecision,
    SecurityFinding,
    TaintMetadata,
)


class FirewallExecutionResult(BaseModel):
    """Result returned by the ToolGateway after intercepting a tool request."""

    request_id: str
    decision: SecurityDecision
    action: str
    sensitivity: str
    reason: str
    tainted: bool
    executed: bool
    findings: List[SecurityFinding] = Field(default_factory=list)
    taint: Optional[TaintMetadata] = None
    result: Optional[Dict[str, Any]] = None
    trace: List[str] = Field(default_factory=list)


class ToolGateway:
    """Runtime Firewall gateway intercepting all tool requests before execution."""

    def __init__(
        self,
        action_analyzer: Optional[ActionAnalyzer] = None,
        policy_engine: Optional[SecurityPolicyEngine] = None,
        influence_tracker: Optional[InfluenceTracker] = None,
    ):
        self.action_analyzer = action_analyzer or ActionAnalyzer()
        self.policy_engine = policy_engine or SecurityPolicyEngine()
        self.influence_tracker = influence_tracker or InfluenceTracker()

    def process_tool_request(
        self,
        tool_request: ToolRequest,
        agent_context: AgentContextModel,
        source_type: str = "TEXT",
        findings: Optional[List[SecurityFinding]] = None,
        taint_meta: Optional[TaintMetadata] = None,
    ) -> FirewallExecutionResult:
        """Intercept tool request, evaluate security policy, and execute mock handler if ALLOWED."""
        request_id = tool_request.request_id or agent_context.request_id

        # 1. Track influence
        influence_record = self.influence_tracker.track_influence(
            agent_context=agent_context,
            tool_request=tool_request,
            source_type=source_type,
        )

        # 2. Analyze action sensitivity
        sensitivity_info = self.action_analyzer.analyze_action(tool_request.action)

        # 3. Security policy evaluation
        policy_result = self.policy_engine.evaluate(
            action_sensitivity=sensitivity_info,
            influenced=influence_record.influenced,
            findings=findings,
        )

        # 4. Construct Runtime Provenance Trace
        runtime_trace: List[str] = list(influence_record.trace)
        runtime_trace.append(f"SENSITIVITY_{sensitivity_info.sensitivity.value}")
        runtime_trace.append(policy_result.trace_tag)

        # 5. Handle Tool Execution (ALLOW -> Safe Mock Execution, BLOCK/CONFIRM -> Do NOT execute)
        if policy_result.decision == SecurityDecision.ALLOW:
            mock_output = self._execute_mock_tool(tool_request)
            executed = True
        else:
            mock_output = None
            executed = False

        return FirewallExecutionResult(
            request_id=request_id,
            decision=policy_result.decision,
            action=tool_request.action,
            sensitivity=sensitivity_info.sensitivity.value,
            reason=policy_result.reason,
            tainted=influence_record.influenced,
            executed=executed,
            findings=findings or [],
            taint=taint_meta,
            result=mock_output,
            trace=runtime_trace,
        )

    def _execute_mock_tool(self, tool_request: ToolRequest) -> Dict[str, Any]:
        """Safe mock execution handler. Performs NO real external actions."""
        return {
            "executed": True,
            "tool": tool_request.tool_name,
            "action": tool_request.action,
            "result": "MOCK_EXECUTION_SUCCESS",
            "message": f"Simulated safe execution of '{tool_request.action}' for demonstration.",
        }
