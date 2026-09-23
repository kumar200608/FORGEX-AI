"""Audit Logger module for immutable security event records."""

import json
from pathlib import Path
from typing import Dict, List, Optional
from app.core.config import get_settings
from app.core.models import AuditEvent

settings = get_settings()


class AuditLogger:
    """Stores and retrieves security decision audit records."""

    def __init__(self, log_dir: Optional[Path] = None):
        self.log_dir = log_dir or settings.AUDIT_LOG_DIR
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.log_dir / "audit_events.jsonl"
        self._memory_events: Dict[str, AuditEvent] = {}

    def log_event(self, event: AuditEvent) -> AuditEvent:
        """Record an immutable audit event in-memory and to disk."""
        self._memory_events[event.event_id] = event

        # Append to JSONL log file
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(event.model_dump_json() + "\n")
        except Exception:
            # Audit logging must not crash the application
            pass

        return event

    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """Retrieve an audit event by its unique ID."""
        return self._memory_events.get(event_id)

    def list_events(self, limit: int = 50) -> List[AuditEvent]:
        """Return recently recorded audit events."""
        events = list(self._memory_events.values())
        return events[-limit:]

    def clear(self):
        """Clear memory cache (for tests)."""
        self._memory_events.clear()


# Global audit logger singleton
audit_logger = AuditLogger()


def get_audit_logger() -> AuditLogger:
    """Return the global audit logger instance."""
    return audit_logger
