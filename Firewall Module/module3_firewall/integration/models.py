from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from module3_firewall.models.security import (
    SourceType,
    RiskLevel,
    SecurityDecision,
    SecurityFinding,
    ToolRequest,
)


class FirewallEvaluationRequest(BaseModel):
    """Input payload for end-to-end firewall evaluation."""

    source_type: SourceType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tool_request: ToolRequest


class FirewallEvaluationResponse(BaseModel):
    """Complete end-to-end response output for Module 3 firewall evaluation."""

    request_id: str
    source_type: SourceType
    risk_level: RiskLevel
    taint_id: Optional[str] = None
    influenced: bool
    tool_name: str
    action: str
    sensitivity: str
    decision: SecurityDecision
    executed: bool
    result: Optional[Dict[str, Any]] = None
    findings: List[SecurityFinding] = Field(default_factory=list)
    trace: List[str] = Field(default_factory=list)
