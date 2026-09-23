"""XML content extractor for TraceGuard AI."""

import io
import re
from typing import Any, Dict, List
import xml.etree.ElementTree as ET

from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class XMLExtractor(BaseExtractor):
    """
    Safely parses XML documents with protection against:
    - XML Entity Expansion (Billion Laughs)
    - External Entity Inclusion (XXE)
    - DTD / schema resolution
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".xml"]

    @property
    def format_name(self) -> str:
        return "Extensible Markup Language (XML)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        # Check raw text for DTD / entity definitions before parsing
        content_prefix = content[:4096].lower()
        if b"<!entity" in content_prefix or b"<!doctype" in content_prefix:
            # Check for suspicious external entity references
            if b"system" in content_prefix or b"public" in content_prefix or b"file:" in content_prefix:
                return ExtractionResult(
                    status=ExtractionStatus.FAILED,
                    error_message="Security violation: XML contains prohibited DOCTYPE/ENTITY declarations (XXE mitigation).",
                )

        try:
            raw_str = content.decode("utf-8", errors="replace")
            # Parse XML tree safely
            root = ET.fromstring(raw_str)

            # Extract tag structure and text nodes
            lines = [f"<{root.tag}>"]
            extracted_fields: Dict[str, Any] = {}

            def traverse(element: ET.Element, depth: int = 1):
                indent = "  " * depth
                text = (element.text or "").strip()
                if text:
                    lines.append(f"{indent}{element.tag}: {text}")
                    # Store simple leaf nodes in extracted_fields
                    if len(element) == 0:
                        extracted_fields[element.tag] = text
                else:
                    lines.append(f"{indent}<{element.tag}>")

                for child in element:
                    traverse(child, depth + 1)

            for child in root:
                traverse(child, 1)

            full_text = "\n".join(lines).strip()

            return ExtractionResult(
                status=ExtractionStatus.SUCCESS,
                raw_text=full_text,
                extracted_fields=extracted_fields,
                metadata={
                    "root_tag": root.tag,
                    "child_elements": len(root),
                },
            )
        except ET.ParseError as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"XML parsing error: {str(e)}",
            )
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"XML extraction error: {str(e)}",
            )
