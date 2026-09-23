"""CSV content extractor for TraceGuard AI."""

import csv
import io
from typing import Any, Dict, List
from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class CSVExtractor(BaseExtractor):
    """
    Safely parses CSV data and converts to normalized text representation.
    Protects against Dynamic Data Exchange (DDE) and CSV formula execution.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".csv"]

    @property
    def format_name(self) -> str:
        return "Comma-Separated Values (CSV)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        try:
            # Decode text
            text_data = ""
            for encoding in ["utf-8", "latin-1"]:
                try:
                    text_data = content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue

            if not text_data:
                return ExtractionResult(
                    status=ExtractionStatus.FAILED,
                    error_message="Failed to decode CSV bytes into readable text.",
                )

            # Check for null bytes
            text_data = text_data.replace("\x00", "")

            f = io.StringIO(text_data)
            reader = csv.reader(f)
            
            rows: List[List[str]] = []
            formula_cells_found = 0

            for r in reader:
                sanitized_row = []
                for cell in r:
                    cleaned_cell = cell.strip()
                    # Neutralize CSV formula prefixes (=, +, -, @, \t, \r)
                    if cleaned_cell.startswith(("=", "+", "-", "@")):
                        formula_cells_found += 1
                        cleaned_cell = f"'{cleaned_cell}"
                    sanitized_row.append(cleaned_cell)
                if any(sanitized_row):
                    rows.append(sanitized_row)

            if not rows:
                return ExtractionResult(
                    status=ExtractionStatus.PARTIAL,
                    raw_text="",
                    metadata={"row_count": 0, "column_count": 0},
                    warnings=["CSV file is empty or contains only blank rows."],
                )

            headers = rows[0]
            data_rows = rows[1:]

            # Build text table representation
            table_lines = [f"[CSV Table: {len(rows)} rows, {len(headers)} columns]"]
            table_lines.append(" | ".join(headers))
            table_lines.append("-" * min(80, max(20, sum(len(h) + 3 for h in headers))))

            for r in data_rows[:100]:  # limit to first 100 rows for display
                table_lines.append(" | ".join(r))
            
            if len(data_rows) > 100:
                table_lines.append(f"... ({len(data_rows) - 100} additional rows truncated)")

            full_text = "\n".join(table_lines)

            # Extract fields dictionary if header-value mapping exists
            extracted_fields: Dict[str, Any] = {
                "columns": headers,
                "row_count": len(rows),
            }
            if data_rows:
                sample_dict = {}
                for idx, h in enumerate(headers):
                    if idx < len(data_rows[0]):
                        sample_dict[h.lower().replace(" ", "_")] = data_rows[0][idx]
                extracted_fields["first_row"] = sample_dict

            warnings = []
            if formula_cells_found > 0:
                warnings.append(
                    f"Neutralized {formula_cells_found} cell(s) starting with formula characters (=, +, -, @)."
                )

            return ExtractionResult(
                status=ExtractionStatus.SUCCESS,
                raw_text=full_text,
                extracted_fields=extracted_fields,
                metadata={
                    "row_count": len(rows),
                    "column_count": len(headers),
                    "formula_cells_neutralized": formula_cells_found,
                },
                warnings=warnings,
            )
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"CSV parsing error: {str(e)}",
            )
