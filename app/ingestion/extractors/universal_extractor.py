"""Universal multi-format content extractor and ingestion pipeline for TraceGuard AI."""

import hashlib
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import get_settings
from app.core.models import (
    FileValidationResult,
    InjectionDetectionResult,
    SourceRecord,
    SourceType,
    SupportedFormat,
    TaintStatus,
    TrustLevel,
    UniversalUploadResponse,
)
from app.core.security import FileValidationError, sanitize_filename, validate_file_content
from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus
from app.ingestion.extractors.csv_parser import CSVExtractor
from app.ingestion.extractors.docx_parser import DocxExtractor
from app.ingestion.extractors.email_parser import EmailExtractor
from app.ingestion.extractors.html_parser import HTMLExtractor
from app.ingestion.extractors.image_ocr import ImageOCRExtractor
from app.ingestion.extractors.json_parser import JSONExtractor
from app.ingestion.extractors.pdf_parser import PDFExtractor
from app.ingestion.extractors.text_parser import TextExtractor
from app.ingestion.extractors.xml_parser import XMLExtractor

settings = get_settings()

SUPPORTED_EXTENSIONS_MAP: Dict[str, BaseExtractor] = {
    ".pdf": PDFExtractor(),
    ".txt": TextExtractor(),
    ".md": TextExtractor(),
    ".docx": DocxExtractor(),
    ".eml": EmailExtractor(),
    ".csv": CSVExtractor(),
    ".json": JSONExtractor(),
    ".xml": XMLExtractor(),
    ".html": HTMLExtractor(),
    ".htm": HTMLExtractor(),
    ".png": ImageOCRExtractor(),
    ".jpg": ImageOCRExtractor(),
    ".jpeg": ImageOCRExtractor(),
    ".webp": ImageOCRExtractor(),
}

EXTENSION_TO_SOURCE_TYPE: Dict[str, SourceType] = {
    ".pdf": SourceType.PDF,
    ".txt": SourceType.DOCUMENT,
    ".md": SourceType.MARKDOWN,
    ".docx": SourceType.DOCX,
    ".eml": SourceType.EMAIL,
    ".csv": SourceType.CSV,
    ".json": SourceType.JSON,
    ".xml": SourceType.XML,
    ".html": SourceType.HTML,
    ".htm": SourceType.HTML,
    ".png": SourceType.IMAGE,
    ".jpg": SourceType.IMAGE,
    ".jpeg": SourceType.IMAGE,
    ".webp": SourceType.IMAGE,
}

EXTENSION_TO_MEDIA_TYPE: Dict[str, str] = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".eml": "message/rfc822",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "application/xml",
    ".html": "text/html",
    ".htm": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 cryptographic digest of raw byte content."""
    return hashlib.sha256(content).hexdigest()


class UniversalExtractor:
    """Master multi-format extractor and ingestion processor."""

    def __init__(self):
        self.extractors = SUPPORTED_EXTENSIONS_MAP

    def is_extension_supported(self, filename: str) -> bool:
        _, ext = os.path.splitext(filename.lower())
        return ext in self.extractors

    def get_supported_extensions(self) -> List[str]:
        return sorted(list(self.extractors.keys()))

    def process_upload(
        self,
        filename: str,
        content: bytes,
        save_to_disk: bool = True,
    ) -> Tuple[SourceRecord, ExtractionResult, UniversalUploadResponse]:
        """
        Validate, extract, hash, and structure any uploaded file.
        
        Security guarantees:
        - Strict extension validation against supported whitelist
        - File size limit enforced
        - Filename sanitization & path traversal prevention
        - Cryptographic SHA-256 content hashing
        - Initial trust level strictly assigned as UNTRUSTED_EXTERNAL
        """
        # 1. Validate file
        allowed_exts = set(self.extractors.keys())
        validation: FileValidationResult = validate_file_content(
            filename=filename,
            content=content,
            max_size_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
            allowed_extensions=allowed_exts,
        )
        if not validation.is_valid:
            raise FileValidationError(validation.error_message or "File validation failed.")

        _, ext = os.path.splitext(filename.lower())
        extractor = self.extractors.get(ext)
        if not extractor:
            raise FileValidationError(f"Unsupported file format: '{ext}'. Supported formats: {sorted(list(allowed_exts))}")

        # 2. Compute SHA-256 Digest
        content_hash = compute_sha256(content)

        # 3. Safely extract normalized content
        extraction_result = extractor.extract(filename=filename, content=content)

        # 4. Save to upload dir safely if requested
        sanitized_name = validation.sanitized_name or sanitize_filename(filename, allowed_extensions=allowed_exts)
        if save_to_disk:
            dest_path = settings.UPLOAD_DIR / sanitized_name
            dest_path.write_bytes(content)

        # 5. Build SourceRecord
        source_type = EXTENSION_TO_SOURCE_TYPE.get(ext, SourceType.DOCUMENT)
        media_type = EXTENSION_TO_MEDIA_TYPE.get(ext, "application/octet-stream")

        source_record = SourceRecord(
            source_type=source_type,
            filename=sanitized_name,
            original_filename=filename,
            content_hash=content_hash,
            trust_level=TrustLevel.UNTRUSTED_EXTERNAL,
            taint_status=TaintStatus.UNTRUSTED,
            raw_text=extraction_result.raw_text,
            extracted_fields=extraction_result.extracted_fields,
            metadata={
                "media_type": media_type,
                "file_size_bytes": len(content),
                "format_name": extractor.format_name,
                "extraction_status": extraction_result.status.value,
                "warnings": extraction_result.warnings,
                **extraction_result.metadata,
            },
        )

        upload_response = UniversalUploadResponse(
            source_id=source_record.source_id,
            filename=sanitized_name,
            original_filename=filename,
            format=ext.lstrip("."),
            media_type=media_type,
            file_size_bytes=len(content),
            content_hash=content_hash,
            extraction_status=extraction_result.status.value,
            extracted_text=extraction_result.raw_text,
            trust_level=TrustLevel.UNTRUSTED_EXTERNAL,
            taint_status=TaintStatus.UNTRUSTED,
            extracted_fields=extraction_result.extracted_fields,
            metadata=source_record.metadata,
        )

        return source_record, extraction_result, upload_response


_universal_extractor_instance: Optional[UniversalExtractor] = None


def get_universal_extractor() -> UniversalExtractor:
    """Singleton getter for UniversalExtractor."""
    global _universal_extractor_instance
    if _universal_extractor_instance is None:
        _universal_extractor_instance = UniversalExtractor()
    return _universal_extractor_instance
