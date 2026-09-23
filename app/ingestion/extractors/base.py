"""Base classes, interfaces, and extraction result schemas for TraceGuard AI."""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ExtractionStatus(str, Enum):
    """Status of content extraction operation."""
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    OCR_UNAVAILABLE = "OCR_UNAVAILABLE"
    UNSUPPORTED = "UNSUPPORTED"
    FAILED = "FAILED"


class ExtractionResult(BaseModel):
    """Normalized structured result from format-specific extractor."""
    status: ExtractionStatus = Field(..., description="Extraction outcome")
    raw_text: str = Field(default="", description="Normalized plain text representation")
    extracted_fields: Dict[str, Any] = Field(default_factory=dict, description="Structured fields or key-values")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Format-specific metadata")
    warnings: List[str] = Field(default_factory=list, description="Parser warnings or non-fatal anomalies")
    error_message: Optional[str] = Field(default=None, description="Error detail if failed")


class BaseExtractor(ABC):
    """Abstract base class for all sandboxed content extractors."""

    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """List of lower-case file extensions handled by this extractor (e.g. ['.pdf'])."""
        pass

    @property
    @abstractmethod
    def format_name(self) -> str:
        """Human-readable format descriptor."""
        pass

    @abstractmethod
    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        """
        Safely extract normalized text and structured data from byte content.
        Must NEVER execute embedded active content, scripts, or macros.
        """
        pass
