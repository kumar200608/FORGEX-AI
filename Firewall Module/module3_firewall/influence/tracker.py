import uuid
from typing import List, Optional
from module3_firewall.influence.models import AgentContextModel, InfluenceRecord
from module3_firewall.influence.context import InfluenceContext
from module3_firewall.models.security import ToolRequest


class InfluenceTracker:
    """Tracker for determining whether untrusted tainted content influenced a tool request."""

    def __init__(self, context: Optional[InfluenceContext] = None):
        self.context = context or InfluenceContext()
        self._ctx_counter = 0
        self._inf_counter = 0

    def create_context(
        self,
        request_id: str,
        content_reference: str = "EXTRACTED_CONTENT",
        taint_ids: Optional[List[str]] = None,
        metadata: Optional[dict] = None,
        custom_context_id: Optional[str] = None,
    ) -> AgentContextModel:
        """Create a new AgentContextModel registered in the request context."""
        if custom_context_id:
            context_id = custom_context_id
        else:
            self._ctx_counter += 1
            context_id = f"CTX-{self._ctx_counter:03d}-{uuid.uuid4().hex[:4]}"

        ctx = AgentContextModel(
            context_id=context_id,
            request_id=request_id,
            content_reference=content_reference,
            taint_ids=taint_ids or [],
            metadata=metadata or {},
        )
        self.context.register_context(ctx)
        return ctx

    def associate_taint(self, context_id: str, taint_id: str) -> Optional[AgentContextModel]:
        """Attach a taint_id to an existing AgentContextModel."""
        ctx = self.context.get_context(context_id)
        if ctx and taint_id not in ctx.taint_ids:
            ctx.taint_ids.append(taint_id)
        return ctx

    def track_influence(
        self,
        agent_context: AgentContextModel,
        tool_request: ToolRequest,
        source_type: str = "TEXT",
    ) -> InfluenceRecord:
        """Determine if tool_request was influenced by tainted content in agent_context."""
        self._inf_counter += 1
        influence_id = f"INF-{self._inf_counter:03d}-{uuid.uuid4().hex[:4]}"

        has_taint = len(agent_context.taint_ids) > 0

        if has_taint:
            trace: List[str] = [source_type.upper()]
            for tid in agent_context.taint_ids:
                if tid not in trace:
                    trace.append(tid)
            trace.extend(["AGENT_CONTEXT", "TOOL_REQUEST", tool_request.action])
        else:
            trace = ["AGENT_CONTEXT", "TOOL_REQUEST", tool_request.action]

        record = InfluenceRecord(
            influence_id=influence_id,
            request_id=tool_request.request_id or agent_context.request_id,
            context_id=agent_context.context_id,
            taint_ids=list(agent_context.taint_ids),
            tool_name=tool_request.tool_name,
            action=tool_request.action,
            influenced=has_taint,
            trace=trace,
        )

        self.context.register_influence(record)
        return record

    def is_tainted_request(self, agent_context: AgentContextModel) -> bool:
        """Return true if agent_context contains any active taint IDs."""
        return len(agent_context.taint_ids) > 0

    def get_influence(self, influence_id: str) -> Optional[InfluenceRecord]:
        """Retrieve recorded InfluenceRecord by influence_id."""
        return self.context.get_influence(influence_id)

    def get_trace(self, influence_id: str) -> List[str]:
        """Get provenance trace for a given influence_id."""
        record = self.context.get_influence(influence_id)
        return record.trace if record else []
