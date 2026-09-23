from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from module3_firewall.models.security import ToolRequest


class AgentContextModel(BaseModel):
    """Represents the context passed to/used by an AI agent.

    Stores reference identifiers and taint provenance, strictly omitting raw sensitive content.
    """

    context_id: str
    request_id: str
    content_reference: str = "EXTRACTED_CONTENT"
    taint_ids: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InfluenceRecord(BaseModel):
    """Tracks whether tainted content in agent context influenced a tool invocation request."""

    influence_id: str
    request_id: str
    context_id: str
    taint_ids: List[str] = Field(default_factory=list)
    tool_name: str
    action: str
    influenced: bool
    trace: List[str] = Field(default_factory=list)


class InfluenceTrackRequest(BaseModel):
    """Request payload for tracking agent context influence on a tool request."""

    agent_context: AgentContextModel
    tool_request: ToolRequest
    source_type: Optional[str] = "TEXT"
