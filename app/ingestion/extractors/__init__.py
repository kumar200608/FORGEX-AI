"""Extractors package for TraceGuard AI."""

from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus
from app.ingestion.extractors.universal_extractor import (
    SUPPORTED_EXTENSIONS_MAP,
    UniversalExtractor,
    get_universal_extractor,
)

__all__ = [
    "BaseExtractor",
    "ExtractionResult",
    "ExtractionStatus",
    "SUPPORTED_EXTENSIONS_MAP",
    "UniversalExtractor",
    "get_universal_extractor",
]
