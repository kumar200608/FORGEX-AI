from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class TaintRecord(BaseModel):
    """Represents data provenance and trust state for untrusted external inputs.

    Does NOT store sensitive payload content to ensure privacy and security.
    """

    taint_id: str
    source_type: str
    source_reference: str
    reason: str = "external_untrusted_content"
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    labels: List[str] = Field(default_factory=lambda: ["UNTRUSTED"])
    parent_taint_id: Optional[str] = None
