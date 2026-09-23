from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    PDF = "pdf"
    EMAIL = "email"
    WEB = "web"
    TEXT = "text"


class SecurityDecision(str, Enum):
    ALLOW = "ALLOW"
    CONFIRM = "CONFIRM"
    BLOCK = "BLOCK"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class SecurityInput(BaseModel):
    source_type: SourceType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SecurityFinding(BaseModel):
    category: str
    severity: str
    description: str


class TaintMetadata(BaseModel):
    taint_id: str
    source_type: str
    source_reference: str
    reason: str


class ToolRequest(BaseModel):
    tool_name: str
    action: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    request_id: str


class FirewallResult(BaseModel):
    request_id: str
    decision: SecurityDecision
    findings: List[SecurityFinding] = Field(default_factory=list)
    taint: Optional[TaintMetadata] = None
    trace: List[str] = Field(default_factory=list)
    action: Optional[str] = None
    sensitivity: Optional[str] = None
    reason: Optional[str] = None
    executed: bool = False
    result: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    request_id: str
    source_type: SourceType
    is_untrusted: bool = True
    taint: Optional[TaintMetadata] = None
    findings: List[SecurityFinding] = Field(default_factory=list)
    risk_level: RiskLevel
    trace: List[str] = Field(default_factory=list)
