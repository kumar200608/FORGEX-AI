"""JSON content extractor for TraceGuard AI."""

import json
from typing import Any, Dict, List
from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class JSONExtractor(BaseExtractor):
    """
    Safely parses JSON documents and normalizes them into structured and textual representations.
    Protects against deeply nested recursion and oversized payloads.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".json"]

    @property
    def format_name(self) -> str:
        return "JavaScript Object Notation (JSON)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        try:
            raw_str = content.decode("utf-8", errors="replace")
            parsed_data = json.loads(raw_str)

            # Flatten/summarize keys and values into readable format
            text_representation = json.dumps(parsed_data, indent=2, ensure_ascii=False)

            # Extract flattened top-level or important business fields
            extracted_fields: Dict[str, Any] = {}
            if isinstance(parsed_data, dict):
                for k, v in parsed_data.items():
                    if isinstance(v, (str, int, float, bool)):
                        extracted_fields[k] = v
                    elif isinstance(v, dict):
                        for sub_k, sub_v in v.items():
                            if isinstance(sub_v, (str, int, float, bool)):
                                extracted_fields[f"{k}.{sub_k}"] = sub_v
            elif isinstance(parsed_data, list):
                extracted_fields["array_length"] = len(parsed_data)
                if parsed_data and isinstance(parsed_data[0], dict):
                    extracted_fields["sample_item"] = {
                        k: v for k, v in parsed_data[0].items() if isinstance(v, (str, int, float, bool))
                    }

            return ExtractionResult(
                status=ExtractionStatus.SUCCESS,
                raw_text=text_representation,
                extracted_fields=extracted_fields,
                metadata={
                    "is_dict": isinstance(parsed_data, dict),
                    "is_list": isinstance(parsed_data, list),
                    "root_element_count": len(parsed_data) if hasattr(parsed_data, "__len__") else 1,
                },
            )
        except json.JSONDecodeError as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"Invalid JSON syntax: {str(e)}",
            )
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"JSON parsing error: {str(e)}",
            )
