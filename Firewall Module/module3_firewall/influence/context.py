from typing import Dict, Optional
from module3_firewall.influence.models import AgentContextModel, InfluenceRecord


class InfluenceContext:
    """Request-scoped container for active agent contexts and influence records.

    Guarantees strict isolation between distinct request lifetimes.
    """

    def __init__(self, request_id: Optional[str] = None):
        self.request_id = request_id or "default_request"
        self._contexts: Dict[str, AgentContextModel] = {}  # context_id -> AgentContextModel
        self._records: Dict[str, InfluenceRecord] = {}  # influence_id -> InfluenceRecord

    def register_context(self, context: AgentContextModel) -> None:
        self._contexts[context.context_id] = context

    def get_context(self, context_id: str) -> Optional[AgentContextModel]:
        return self._contexts.get(context_id)

    def register_influence(self, record: InfluenceRecord) -> None:
        self._records[record.influence_id] = record

    def get_influence(self, influence_id: str) -> Optional[InfluenceRecord]:
        return self._records.get(influence_id)

    def clear(self) -> None:
        self._contexts.clear()
        self._records.clear()
