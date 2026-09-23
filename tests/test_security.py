"""Tests for security utilities, filename sanitization, and input validation."""

from pathlib import Path
import pytest

from app.core.security import (
    FileValidationError,
    PathTraversalError,
    prevent_path_traversal,
    sanitize_filename,
    validate_file_content,
)

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".eml", ".json", ".csv", ".md"}


class TestFilenameSanitization:
    """Test suite for safe filename handling and injection prevention."""

    def test_valid_filename(self):
        """Sanitizing a valid filename should succeed and retain extension."""
        safe_name = sanitize_filename("invoice_2026.pdf", allowed_extensions=ALLOWED_EXTENSIONS, prefix_uuid=False)
        assert safe_name == "invoice_2026.pdf"

    def test_uuid_prefix_generation(self):
        """Prefixing UUID should yield a unique identifier followed by clean name."""
        safe_name = sanitize_filename("report.txt", allowed_extensions=ALLOWED_EXTENSIONS, prefix_uuid=True)
        assert safe_name.endswith("_report.txt")
        assert len(safe_name) > len("report.txt")

    def test_path_traversal_stripping(self):
        """Directory path components (../, ../../, /) must be stripped safely."""
        safe_name = sanitize_filename("../../etc/passwd.txt", allowed_extensions=ALLOWED_EXTENSIONS, prefix_uuid=False)
        assert "/" not in safe_name
        assert "\\" not in safe_name
        assert ".." not in safe_name
        assert safe_name == "passwd.txt"

    def test_windows_traversal_stripping(self):
        """Windows backslash path components must be stripped safely."""
        safe_name = sanitize_filename("..\\..\\Windows\\System32\\cmd.pdf", allowed_extensions=ALLOWED_EXTENSIONS, prefix_uuid=False)
        assert safe_name == "cmd.pdf"

    def test_null_byte_injection_rejection(self):
        """Null bytes inside filenames must be strictly rejected."""
        with pytest.raises(FileValidationError, match="Null byte detected"):
            sanitize_filename("legit.pdf\x00.exe", allowed_extensions=ALLOWED_EXTENSIONS)

    def test_disallowed_extension_rejection(self):
        """Files with extensions outside the whitelist must be rejected."""
        with pytest.raises(FileValidationError, match="File extension '.exe' is not permitted"):
            sanitize_filename("malicious_payload.exe", allowed_extensions=ALLOWED_EXTENSIONS)

        with pytest.raises(FileValidationError, match="File extension '.sh' is not permitted"):
            sanitize_filename("hack.sh", allowed_extensions=ALLOWED_EXTENSIONS)

    def test_missing_extension_rejection(self):
        """Files without an extension must be rejected."""
        with pytest.raises(FileValidationError, match="valid extension"):
            sanitize_filename("filename_without_extension", allowed_extensions=ALLOWED_EXTENSIONS)

    def test_windows_reserved_device_names(self):
        """Windows reserved names (CON, NUL, AUX, etc.) must be safely prefixed."""
        safe_name = sanitize_filename("CON.txt", allowed_extensions=ALLOWED_EXTENSIONS, prefix_uuid=False)
        assert safe_name.startswith("safe_CON")


class TestPathTraversalPrevention:
    """Test suite for filesystem boundary enforcement."""

    def test_valid_contained_path(self, tmp_path: Path):
        """Paths inside the base directory must resolve cleanly."""
        base_dir = tmp_path / "sandbox"
        base_dir.mkdir()
        target = "uploads/safe_file.txt"

        resolved = prevent_path_traversal(base_dir, target)
        assert str(resolved).startswith(str(base_dir.resolve()))

    def test_illegal_traversal_escape(self, tmp_path: Path):
        """Paths attempting to break out of the base directory must raise PathTraversalError."""
        base_dir = tmp_path / "sandbox"
        base_dir.mkdir()

        with pytest.raises(PathTraversalError):
            prevent_path_traversal(base_dir, "../../../secret.key")


class TestFileValidation:
    """Test suite for file content and size validation."""

    def test_valid_text_file(self):
        """Valid text file within size limits should pass validation."""
        content = b"User requested payment processing for approved vendor."
        result = validate_file_content(
            filename="document.txt",
            content=content,
            max_size_bytes=1024 * 1024,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )
        assert result.is_valid is True
        assert result.sanitized_name is not None
        assert result.file_size_bytes == len(content)
        assert result.extension == ".txt"

    def test_oversized_file_rejection(self):
        """Files exceeding the maximum size limit must fail validation."""
        content = b"A" * 2000
        result = validate_file_content(
            filename="large_data.json",
            content=content,
            max_size_bytes=1000,  # 1000 byte limit
            allowed_extensions=ALLOWED_EXTENSIONS,
        )
        assert result.is_valid is False
        assert "exceeds maximum permitted limit" in (result.error_message or "")

    def test_empty_file_rejection(self):
        """Zero-byte files must fail validation."""
        result = validate_file_content(
            filename="empty.csv",
            content=b"",
            max_size_bytes=1000,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )
        assert result.is_valid is False
        assert "empty (0 bytes)" in (result.error_message or "")

    def test_pdf_signature_check_valid(self):
        """Valid PDF with standard %PDF- header must pass."""
        pdf_content = b"%PDF-1.7\nSample binary pdf payload"
        result = validate_file_content(
            filename="invoice.pdf",
            content=pdf_content,
            max_size_bytes=1024 * 1024,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )
        assert result.is_valid is True

    def test_pdf_signature_check_invalid(self):
        """Spoofed PDF with invalid header must fail validation."""
        fake_pdf_content = b"This is plain text pretending to be a PDF"
        result = validate_file_content(
            filename="fake_invoice.pdf",
            content=fake_pdf_content,
            max_size_bytes=1024 * 1024,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )
        assert result.is_valid is False
        assert "Invalid PDF signature" in (result.error_message or "")
