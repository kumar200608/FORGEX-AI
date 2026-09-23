"""Provenance Source Registry for tracking all ingested document sources."""

from typing import Dict, List, Optional
from app.core.models import SourceRecord, TaintStatus


class SourceRegistry:
    """In-memory source provenance registry preserving document origin and metadata."""

    def __init__(self):
        self._sources: Dict[str, SourceRecord] = {}

    def register_source(self, source: SourceRecord) -> SourceRecord:
        """Register a new source record in the provenance registry."""
        self._sources[source.source_id] = source
        return source

    def get_source(self, source_id: str) -> Optional[SourceRecord]:
        """Retrieve a registered source record by its unique ID."""
        return self._sources.get(source_id)

    def list_sources(self) -> List[SourceRecord]:
        """Return all registered source records in insertion order."""
        return list(self._sources.values())

    def update_taint_status(self, source_id: str, new_status: TaintStatus) -> Optional[SourceRecord]:
        """Update taint status for an existing source record."""
        source = self.get_source(source_id)
        if source:
            updated = source.model_copy(update={"taint_status": new_status})
            self._sources[source_id] = updated
            return updated
        return None

    def clear(self):
        """Clear registry (used for tests)."""
        self._sources.clear()


# Global singleton instance for application lifetime
_global_registry = SourceRegistry()


def get_source_registry() -> SourceRegistry:
    """Return global singleton source registry."""
    return _global_registry
