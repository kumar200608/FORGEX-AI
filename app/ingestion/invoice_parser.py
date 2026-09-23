"""Invoice document parser and ingestion module for TraceGuard AI."""

import hashlib
import io
import os
from pathlib import Path
import re
from typing import Any, Dict, Optional, Tuple

import pypdf

from app.core.config import get_settings
from app.core.models import FileValidationResult, SourceRecord, SourceType, TaintStatus, TrustLevel
from app.core.security import FileValidationError, sanitize_filename, validate_file_content

settings = get_settings()


def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 cryptographic digest of raw byte content."""
    return hashlib.sha256(content).hexdigest()


def extract_text_from_pdf(content: bytes) -> str:
    """Safely extract plain text from PDF bytes without executing embedded scripts."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(content))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_pages.append(text.strip())
        return "\n".join(extracted_pages).strip()
    except Exception as e:
        raise FileValidationError(f"Failed to extract text from PDF document: {str(e)}")


def extract_text_from_txt(content: bytes) -> str:
    """Safely decode plain text bytes."""
    try:
        # Try UTF-8 first, fallback to latin-1
        return content.decode("utf-8").strip()
    except UnicodeDecodeError:
        try:
            return content.decode("latin-1").strip()
        except Exception as e:
            raise FileValidationError(f"Failed to decode text document: {str(e)}")


def extract_invoice_fields(text: str) -> Dict[str, Any]:
    """
    Extract structured business fields from unstructured invoice text using deterministic regex.
    Data is strictly treated as UNTRUSTED DATA.
    """
    fields: Dict[str, Any] = {}

    # Vendor extraction
    vendor_match = re.search(r"(?:Vendor|Billed By|Supplier|Company):\s*([^\n\r]+)", text, re.IGNORECASE)
    if vendor_match:
        fields["vendor"] = vendor_match.group(1).strip()

    # Invoice Number
    inv_num_match = re.search(r"(?:Invoice\s*(?:No|Number|#)|INV-?):\s*([A-Z0-9\-_]+)", text, re.IGNORECASE)
    if inv_num_match:
        fields["invoice_number"] = inv_num_match.group(1).strip()

    # Amount & Currency
    amount_match = re.search(r"(?:Total\s*Amount|Amount\s*Due|Total):\s*(?:[₹$€£]\s*)?([0-9,]+(?:\.[0-9]{2})?)", text, re.IGNORECASE)
    if amount_match:
        raw_amt = amount_match.group(1).replace(",", "")
        try:
            fields["amount"] = float(raw_amt)
        except ValueError:
            fields["amount"] = raw_amt

    currency_match = re.search(r"(?:Currency|Total):\s*([₹$€£]|INR|USD|EUR|GBP)", text, re.IGNORECASE)
    if currency_match:
        fields["currency"] = currency_match.group(1).strip()
    elif "₹" in text or "INR" in text:
        fields["currency"] = "INR"
    elif "$" in text or "USD" in text:
        fields["currency"] = "USD"
    else:
        fields["currency"] = "USD"

    # Beneficiary Account
    beneficiary_match = re.search(r"(?:Beneficiary(?:\s*Account)?|Bank\s*Account|Account\s*Number|IBAN):\s*([A-Z0-9\-_]+)", text, re.IGNORECASE)
    if beneficiary_match:
        fields["beneficiary_account"] = beneficiary_match.group(1).strip()

    # Due Date
    due_date_match = re.search(r"(?:Due\s*Date|Payment\s*Due):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}/[0-9]{2}/[0-9]{4})", text, re.IGNORECASE)
    if due_date_match:
        fields["due_date"] = due_date_match.group(1).strip()

    return fields


def parse_invoice_bytes(
    filename: str,
    content: bytes,
    save_to_upload_dir: bool = True,
) -> SourceRecord:
    """
    Validate, sanitize, parse, and generate a SourceRecord for an uploaded invoice.
    
    Security guarantees:
    - File size limits enforced
    - Extension whitelist enforced (.pdf, .txt)
    - Path traversal prevented
    - SHA-256 hash computed
    - Data marked UNTRUSTED_EXTERNAL
    """
    # 1. Validate file
    validation: FileValidationResult = validate_file_content(
        filename=filename,
        content=content,
        max_size_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
        allowed_extensions={".pdf", ".txt"},
    )
    if not validation.is_valid:
        raise FileValidationError(validation.error_message or "File validation failed.")

    # 2. Compute cryptographic digest
    content_hash = compute_sha256(content)

    # 3. Extract text according to format
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        raw_text = extract_text_from_pdf(content)
    elif ext == ".txt":
        raw_text = extract_text_from_txt(content)
    else:
        raise FileValidationError(f"Unsupported invoice file extension: {ext}")

    if not raw_text.strip():
        raise FileValidationError("Invoice document contains no extractable text.")

    # 4. Extract structured fields
    fields = extract_invoice_fields(raw_text)

    # 5. Optionally store safely in controlled directory
    sanitized_filename = validation.sanitized_name or sanitize_filename(filename)
    if save_to_upload_dir:
        dest_path = settings.UPLOAD_DIR / sanitized_filename
        dest_path.write_bytes(content)

    # 6. Return immutable SourceRecord
    return SourceRecord(
        source_type=SourceType.INVOICE,
        filename=sanitized_filename,
        original_filename=filename,
        content_hash=content_hash,
        trust_level=TrustLevel.UNTRUSTED_EXTERNAL,
        taint_status=TaintStatus.UNTRUSTED,
        raw_text=raw_text,
        extracted_fields=fields,
        metadata={
            "file_size_bytes": len(content),
            "parser": "TraceGuard-InvoiceParser-v1",
        },
    )


def parse_invoice_file(file_path: Path | str) -> SourceRecord:
    """Parse an invoice from a local file path."""
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        raise FileValidationError(f"Invoice file not found at path: {file_path}")
    content = path.read_bytes()
    return parse_invoice_bytes(filename=path.name, content=content, save_to_upload_dir=False)
