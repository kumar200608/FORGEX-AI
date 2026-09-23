"""PDF document content extractor for TraceGuard AI."""

import io
from typing import List
import pypdf

from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class PDFExtractor(BaseExtractor):
    """Safely extracts text and page metadata from PDF documents."""

    @property
    def supported_extensions(self) -> List[str]:
        return [".pdf"]

    @property
    def format_name(self) -> str:
        return "Portable Document Format (PDF)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        if not content.startswith(b"%PDF-"):
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message="Invalid PDF signature: file header does not start with %PDF-",
            )

        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            page_count = len(reader.pages)
            extracted_pages = []
            page_details = []

            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                clean_page_text = text.strip()
                if clean_page_text:
                    extracted_pages.append(f"[Page {i + 1}]\n{clean_page_text}")
                page_details.append({
                    "page_number": i + 1,
                    "char_count": len(clean_page_text),
                    "has_text": bool(clean_page_text),
                })

            full_text = "\n\n".join(extracted_pages).strip()

            if not full_text:
                return ExtractionResult(
                    status=ExtractionStatus.PARTIAL,
                    raw_text="",
                    metadata={
                        "page_count": page_count,
                        "pages": page_details,
                        "is_encrypted": reader.is_encrypted,
                    },
                    warnings=["PDF contains no extractable text layer (may be scanned image)."],
                )

            return ExtractionResult(
                status=ExtractionStatus.SUCCESS,
                raw_text=full_text,
                metadata={
                    "page_count": page_count,
                    "pages": page_details,
                    "is_encrypted": reader.is_encrypted,
                },
            )
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"PDF parsing error: {str(e)}",
            )
