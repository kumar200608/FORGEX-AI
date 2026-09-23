"""Plain text and Markdown content extractor for TraceGuard AI."""

from typing import List
from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class TextExtractor(BaseExtractor):
    """Safely decodes plain text and markdown documents."""

    @property
    def supported_extensions(self) -> List[str]:
        return [".txt", ".md"]

    @property
    def format_name(self) -> str:
        return "Plain Text / Markdown"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        # Check for null bytes
        if b"\x00" in content:
            # Strip null bytes to prevent string truncation exploits
            content = content.replace(b"\x00", b"")

        decoded_text = ""
        encoding_used = "utf-8"
        try:
            decoded_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                decoded_text = content.decode("latin-1")
                encoding_used = "latin-1"
            except Exception as e:
                return ExtractionResult(
                    status=ExtractionStatus.FAILED,
                    error_message=f"Failed to decode text file: {str(e)}",
                )

        clean_text = decoded_text.strip()
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]

        return ExtractionResult(
            status=ExtractionStatus.SUCCESS,
            raw_text=clean_text,
            extracted_fields={},
            metadata={
                "encoding": encoding_used,
                "line_count": len(lines),
                "char_count": len(clean_text),
                "is_markdown": filename.lower().endswith(".md"),
            },
        )
