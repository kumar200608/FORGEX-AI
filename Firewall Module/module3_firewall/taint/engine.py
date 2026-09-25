import uuid
from typing import List, Optional
from module3_firewall.taint.models import TaintRecord
from module3_firewall.taint.context import TaintContext


class TaintEngine:
    """Engine for creating, binding, propagating, and tracing taint metadata."""

    def __init__(self, context: Optional[TaintContext] = None):
        self.context = context or TaintContext()
        self._counter = 0

    def create_taint(
        self,
        source_type: str,
        source_reference: str,
        reason: str = "external_untrusted_content",
        parent_taint_id: Optional[str] = None,
        labels: Optional[List[str]] = None,
        custom_taint_id: Optional[str] = None,
    ) -> TaintRecord:
        """Create a new TaintRecord and register it in the request context."""
        if custom_taint_id:
            taint_id = custom_taint_id
        else:
            self._counter += 1
            taint_id = f"TAINT-{self._counter:03d}-{uuid.uuid4().hex[:4]}"

        record = TaintRecord(
            taint_id=taint_id,
            source_type=str(source_type),
            source_reference=source_reference,
            reason=reason,
            labels=labels or ["UNTRUSTED"],
            parent_taint_id=parent_taint_id,
        )
        self.context.register_taint(record)
        return record

    def assign_taint(
        self,
        data_key: str,
        taint_record: TaintRecord,
        trace_step: str = "EXTRACTED_CONTENT",
        parent_data_key: Optional[str] = None,
    ) -> TaintRecord:
        """Associate a data identifier with an active TaintRecord."""
        self.context.bind_data_to_taint(
            data_key=data_key,
            taint_id=taint_record.taint_id,
            trace_step=trace_step,
            parent_data_key=parent_data_key,
        )
        return taint_record

    def is_tainted(self, data_key: str) -> bool:
        """Check whether data has an associated taint."""
        return self.context.get_taint_for_data(data_key) is not None

    def get_taint(self, data_key: str) -> Optional[TaintRecord]:
        """Get primary TaintRecord for a data identifier."""
        return self.context.get_taint_for_data(data_key)

    def get_sources(self, data_key: str) -> List[TaintRecord]:
        """Get list of ancestor/source TaintRecords associated with data."""
        sources: List[TaintRecord] = []
        current = self.get_taint(data_key)
        visited = set()

        while current and current.taint_id not in visited:
            visited.add(current.taint_id)
            sources.append(current)
            if current.parent_taint_id:
                current = self.context.get_taint_by_id(current.parent_taint_id)
            else:
                break

        return sources

    def propagate_taint(
        self,
        source_data_key: str,
        derived_data_key: str,
        trace_step: str = "DERIVED_DATA",
        create_child: bool = False,
        reason: Optional[str] = None,
    ) -> Optional[TaintRecord]:
        """Propagate taint from source data to derived data object."""
        parent_taint = self.get_taint(source_data_key)
        if not parent_taint:
            return None

        if create_child:
            # Create a child taint record linked to parent
            child_taint = self.create_taint(
                source_type=parent_taint.source_type,
                source_reference=parent_taint.source_reference,
                reason=reason or f"derived_from_{parent_taint.taint_id}",
                parent_taint_id=parent_taint.taint_id,
                labels=parent_taint.labels.copy(),
            )
            self.assign_taint(
                data_key=derived_data_key,
                taint_record=child_taint,
                trace_step=trace_step,
                parent_data_key=source_data_key,
            )
            return child_taint
        else:
            # Preserve existing taint identity
            self.assign_taint(
                data_key=derived_data_key,
                taint_record=parent_taint,
                trace_step=trace_step,
                parent_data_key=source_data_key,
            )
            return parent_taint

    def get_provenance_trace(self, data_key: str) -> List[str]:
        """Retrieve the ordered provenance step trace for a data key."""
        return self.context.get_trace_for_data(data_key)
