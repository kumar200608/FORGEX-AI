"""Security utilities, input validation, and safe file handling for TraceGuard AI."""

import os
from pathlib import Path
import re
from typing import Optional, Set
import uuid

from app.core.models import FileValidationResult

# Reserved Windows filenames that should never be used
WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}


class TraceGuardSecurityException(Exception):
    """Base exception for all security-related errors."""
    pass


class FileValidationError(TraceGuardSecurityException):
    """Raised when file upload validation fails."""
    pass


class PathTraversalError(TraceGuardSecurityException):
    """Raised when an illegal path traversal is detected."""
    pass


class PolicyViolationError(TraceGuardSecurityException):
    """Raised when an operation violates security policy."""
    pass


def sanitize_filename(
    filename: str,
    allowed_extensions: Optional[Set[str]] = None,
    prefix_uuid: bool = True,
) -> str:
    """
    Sanitize and create a safe filename for internal storage.
    
    Protects against:
    - Path traversal (../, ..\\)
    - Null-byte injection (\x00)
    - Control characters & illegal OS characters
    - Windows reserved names (CON, PRN, NUL, etc.)
    - Extension spoofing / double extensions
    - Collisions via UUID prefixing
    """
    if not filename or not isinstance(filename, str):
        raise FileValidationError("Filename must be a non-empty string.")

    # Reject null bytes immediately
    if "\x00" in filename:
        raise FileValidationError("Null byte detected in filename.")

    # Extract base filename (removes directory components)
    basename = os.path.basename(filename.strip().replace("\\", "/"))
    if not basename:
        raise FileValidationError("Invalid filename after directory stripping.")

    # Split name and extension
    name, ext = os.path.splitext(basename)
    ext = ext.lower().strip()

    if not ext:
        raise FileValidationError("Filename must have a valid extension.")

    if allowed_extensions is not None and ext not in allowed_extensions:
        raise FileValidationError(
            f"File extension '{ext}' is not permitted. Allowed: {sorted(list(allowed_extensions))}"
        )

    # Sanitize the base name: keep only alphanumeric, hyphens, underscores, dots
    clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", name)
    clean_name = re.sub(r"_+", "_", clean_name).strip("._")

    if not clean_name:
        clean_name = "unnamed_file"

    # Check for Windows device names
    root_stem = clean_name.split(".")[0].upper()
    if root_stem in WINDOWS_RESERVED_NAMES:
        clean_name = f"safe_{clean_name}"

    if prefix_uuid:
        unique_prefix = uuid.uuid4().hex[:12]
        return f"{unique_prefix}_{clean_name}{ext}"

    return f"{clean_name}{ext}"


def prevent_path_traversal(base_directory: Path, target_path: Path | str) -> Path:
    """
    Verify that target_path resolves strictly within base_directory.
    Raises PathTraversalError if directory escaping is attempted.
    """
    base_resolved = base_directory.resolve()
    target_resolved = (base_directory / target_path).resolve()

    try:
        # relative_to raises ValueError if target is outside base
        target_resolved.relative_to(base_resolved)
    except ValueError:
        raise PathTraversalError(
            f"Path traversal detected: target '{target_path}' escapes base directory '{base_directory}'."
        )

    return target_resolved


def validate_file_content(
    filename: str,
    content: bytes,
    max_size_bytes: int,
    allowed_extensions: Set[str],
) -> FileValidationResult:
    """
    Validate uploaded file content against size, extension, and signature rules.
    Does not raise uncaught exceptions; returns a structured FileValidationResult.
    """
    if not content:
        return FileValidationResult(
            is_valid=False,
            error_message="Uploaded file is empty (0 bytes).",
            original_name=filename,
            file_size_bytes=0,
        )

    file_size = len(content)
    if file_size > max_size_bytes:
        return FileValidationResult(
            is_valid=False,
            error_message=(
                f"File size ({file_size} bytes) exceeds maximum permitted limit "
                f"({max_size_bytes} bytes)."
            ),
            original_name=filename,
            file_size_bytes=file_size,
        )

    try:
        safe_name = sanitize_filename(filename, allowed_extensions=allowed_extensions)
    except FileValidationError as e:
        return FileValidationResult(
            is_valid=False,
            error_message=str(e),
            original_name=filename,
            file_size_bytes=file_size,
        )

    _, ext = os.path.splitext(filename.lower())

    # Content signature checks for binary formats
    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            return FileValidationResult(
                is_valid=False,
                error_message="Invalid PDF signature: file header does not match PDF format.",
                original_name=filename,
                file_size_bytes=file_size,
                extension=ext,
            )

    return FileValidationResult(
        is_valid=True,
        sanitized_name=safe_name,
        original_name=filename,
        file_size_bytes=file_size,
        extension=ext,
    )
