from typing import Any, Dict, Optional
from module3_firewall.analyzers.engine import SecurityAnalysisEngine
from module3_firewall.taint.engine import TaintEngine
from module3_firewall.influence.tracker import InfluenceTracker
from module3_firewall.gateway.gateway import ToolGateway
from module3_firewall.models.security import SecurityInput, SourceType, ToolRequest
from module3_firewall.integration.models import FirewallEvaluationResponse


class FirewallIntegrationService:
    """Service coordinating end-to-end security analysis, taint tracking, influence checking, and firewall execution."""

    def __init__(
        self,
        analysis_engine: Optional[SecurityAnalysisEngine] = None,
        taint_engine: Optional[TaintEngine] = None,
        influence_tracker: Optional[InfluenceTracker] = None,
        tool_gateway: Optional[ToolGateway] = None,
    ):
        self.taint_engine = taint_engine or TaintEngine()
        self.analysis_engine = analysis_engine or SecurityAnalysisEngine(taint_engine=self.taint_engine)
        self.influence_tracker = influence_tracker or InfluenceTracker()
        self.tool_gateway = tool_gateway or ToolGateway(influence_tracker=self.influence_tracker)

    def evaluate_end_to_end(
        self,
        source_type: SourceType,
        content: str,
        metadata: Dict[str, Any],
        tool_request: ToolRequest,
    ) -> FirewallEvaluationResponse:
        """Run complete end-to-end evaluation flow without duplicating logic."""
        # Step 1: Security Analysis & Taint Tagging
        security_input = SecurityInput(
            source_type=source_type,
            content=content,
            metadata=metadata,
        )
        analysis_res = self.analysis_engine.analyze(security_input)

        request_id = tool_request.request_id or analysis_res.request_id
        taint_id = analysis_res.taint.taint_id if analysis_res.taint else None

        # Step 2: Agent Context Registration
        agent_context = self.influence_tracker.create_context(
            request_id=request_id,
            content_reference="EXTRACTED_CONTENT",
            taint_ids=[taint_id] if taint_id else [],
        )

        # Step 3: Runtime Gateway Interception & Policy Evaluation
        gateway_res = self.tool_gateway.process_tool_request(
            tool_request=tool_request,
            agent_context=agent_context,
            source_type=str(source_type.value if hasattr(source_type, "value") else source_type),
            findings=analysis_res.findings,
            taint_meta=analysis_res.taint,
        )

        return FirewallEvaluationResponse(
            request_id=request_id,
            source_type=source_type,
            risk_level=analysis_res.risk_level,
            taint_id=taint_id,
            influenced=gateway_res.tainted,
            tool_name=tool_request.tool_name,
            action=tool_request.action,
            sensitivity=gateway_res.sensitivity,
            decision=gateway_res.decision,
            executed=gateway_res.executed,
            result=gateway_res.result,
            findings=analysis_res.findings,
            trace=gateway_res.trace,
        )
