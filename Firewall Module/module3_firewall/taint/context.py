from typing import Dict, List, Optional
from module3_firewall.taint.models import TaintRecord


class TaintContext:
    """Request-scoped container for active taints and provenance traces.

    Guarantees strict isolation between distinct request lifetimes.
    """

    def __init__(self, request_id: Optional[str] = None):
        self.request_id = request_id or "default_request"
        self._taints: Dict[str, TaintRecord] = {}  # taint_id -> TaintRecord
        self._data_map: Dict[str, str] = {}  # data_key -> taint_id
        self._provenance: Dict[str, List[str]] = {}  # data_key -> trace steps

    def register_taint(self, record: TaintRecord) -> None:
        self._taints[record.taint_id] = record

    def get_taint_by_id(self, taint_id: str) -> Optional[TaintRecord]:
        return self._taints.get(taint_id)

    def bind_data_to_taint(
        self,
        data_key: str,
        taint_id: str,
        trace_step: Optional[str] = None,
        parent_data_key: Optional[str] = None,
    ) -> None:
        self._data_map[data_key] = taint_id

        record = self._taints.get(taint_id)
        source_label = record.source_type.upper() if record else "UNKNOWN"

        if parent_data_key and parent_data_key in self._provenance:
            self._provenance[data_key] = self._provenance[parent_data_key].copy()
        elif data_key not in self._provenance:
            self._provenance[data_key] = [source_label, taint_id]

        if trace_step and trace_step not in self._provenance[data_key]:
            self._provenance[data_key].append(trace_step)

    def get_taint_for_data(self, data_key: str) -> Optional[TaintRecord]:
        taint_id = self._data_map.get(data_key)
        if taint_id:
            return self._taints.get(taint_id)
        return None

    def get_trace_for_data(self, data_key: str) -> List[str]:
        return self._provenance.get(data_key, [])

    def clear(self) -> None:
        self._taints.clear()
        self._data_map.clear()
        self._provenance.clear()
