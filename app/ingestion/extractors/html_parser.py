"""HTML content extractor for TraceGuard AI."""

from typing import List
from bs4 import BeautifulSoup

from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class HTMLExtractor(BaseExtractor):
    """
    Safely extracts visible text from HTML documents.
    Strips executable scripts, stylesheets, iframes, objects, and event handlers.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".html", ".htm"]

    @property
    def format_name(self) -> str:
        return "HyperText Markup Language (HTML)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        try:
            raw_str = content.decode("utf-8", errors="replace")
            soup = BeautifulSoup(raw_str, "html.parser")

            # Detect dangerous active tags before stripping
            dangerous_tags_found = []
            for tag in ["script", "iframe", "object", "embed", "applet"]:
                elements = soup.find_all(tag)
                if elements:
                    dangerous_tags_found.append(f"<{tag}> ({len(elements)} instances)")
                    for el in elements:
                        el.decompose()

            # Also strip style tags
            for style in soup.find_all("style"):
                style.decompose()

            # Extract title if present
            title = soup.title.string.strip() if soup.title and soup.title.string else ""

            # Extract visible text with clean paragraph spacing
            clean_text = soup.get_text(separator="\n").strip()
            # Collapse excess whitespace/blank lines
            lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
            normalized_text = "\n".join(lines)

            warnings = []
            if dangerous_tags_found:
                warnings.append(
                    f"Active/script tags were removed for safety: {', '.join(dangerous_tags_found)}"
                )

            metadata = {
                "title": title,
                "stripped_tags": dangerous_tags_found,
                "line_count": len(lines),
            }

            return ExtractionResult(
                status=ExtractionStatus.SUCCESS,
                raw_text=normalized_text,
                extracted_fields={"title": title} if title else {},
                metadata=metadata,
                warnings=warnings,
            )
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"HTML parsing error: {str(e)}",
            )
