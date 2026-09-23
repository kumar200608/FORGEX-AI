from typing import Optional, List
from fastapi import FastAPI
from pydantic import BaseModel, Field
from module3_firewall.models.security import (
    SecurityInput,
    AnalysisResponse,
    ToolRequest,
    SecurityFinding,
    TaintMetadata,
)
from module3_firewall.analyzers.engine import SecurityAnalysisEngine
from module3_firewall.influence.models import AgentContextModel, InfluenceTrackRequest, InfluenceRecord
from module3_firewall.influence.tracker import InfluenceTracker
from module3_firewall.gateway.gateway import ToolGateway, FirewallExecutionResult
from module3_firewall.integration.models import FirewallEvaluationRequest, FirewallEvaluationResponse
from module3_firewall.integration.service import FirewallIntegrationService

app = FastAPI(
    title="Unified AI Security Firewall",
    description="Module 3 - Indirect Prompt-Injection Firewall for Tool-Using Agents (Phase 6)",
    version="0.6.0",
)

engine = SecurityAnalysisEngine()
tracker = InfluenceTracker()
gateway = ToolGateway()
integration_service = FirewallIntegrationService()


class FirewallCheckRequest(BaseModel):
    tool_request: ToolRequest
    agent_context: AgentContextModel
    source_type: Optional[str] = "TEXT"
    findings: List[SecurityFinding] = Field(default_factory=list)
    taint: Optional[TaintMetadata] = None


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "module": "Unified AI Security Firewall",
        "phase": 6,
    }


@app.post("/analyze", response_model=AnalysisResponse)
def analyze_content(security_input: SecurityInput) -> AnalysisResponse:
    """Analyze untrusted input from PDF, email, web, or text and return findings with taint tracking."""
    return engine.analyze(security_input)


@app.post("/track-influence", response_model=InfluenceRecord)
def track_influence_endpoint(req: InfluenceTrackRequest) -> InfluenceRecord:
    """Track whether tainted agent context influenced a tool request."""
    return tracker.track_influence(
        agent_context=req.agent_context,
        tool_request=req.tool_request,
        source_type=req.source_type or "TEXT",
    )


@app.post("/firewall/check", response_model=FirewallExecutionResult)
def firewall_check_endpoint(req: FirewallCheckRequest) -> FirewallExecutionResult:
    """Intercept tool request, evaluate security policy, and execute mock handler if ALLOWED."""
    return gateway.process_tool_request(
        tool_request=req.tool_request,
        agent_context=req.agent_context,
        source_type=req.source_type or "TEXT",
        findings=req.findings,
        taint_meta=req.taint,
    )


@app.post("/firewall/evaluate", response_model=FirewallEvaluationResponse)
def firewall_evaluate_endpoint(req: FirewallEvaluationRequest) -> FirewallEvaluationResponse:
    """Run full end-to-end evaluation: security analysis -> taint -> influence -> policy -> gateway."""
    return integration_service.evaluate_end_to_end(
        source_type=req.source_type,
        content=req.content,
        metadata=req.metadata,
        tool_request=req.tool_request,
    )
