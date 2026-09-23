import io
import math
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, UnidentifiedImageError

from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding

logger = logging.getLogger(__name__)

# Standard image magic signatures
MAGIC_SIGNATURES = {
    "png": b"\x89PNG\r\n\x1a\n",
    "jpeg": b"\xff\xd8\xff",
    "gif": (b"GIF87a", b"GIF89a"),
    "bmp": b"BM",
    "tiff_le": b"II*\x00",
    "tiff_be": b"MM\x00*",
}

DANGEROUS_METADATA_PATTERNS = [
    "eval(", "<script", "system(", "exec(", "powershell", "cmd.exe", "/bin/sh",
    "system override", "ignore prior instructions", "ignore all instructions",
    "make_payment", "transfer money", "delete database", "exfiltrate"
]


def calculate_entropy(data: bytes) -> float:
    """Calculate Shannon entropy for a byte string (range 0.0 - 8.0)."""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    counts: Dict[int, int] = {}
    for byte in data:
        counts[byte] = counts.get(byte, 0) + 1
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


class ImageSecurityAnalyzer(BaseAnalyzer):
    """Real static security analyzer for image byte payloads."""

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        """Analyze raw image bytes for structural, magic byte, trailing data, metadata, and entropy anomalies."""
        findings: List[SecurityFinding] = []

        # 1. Gather all candidate image bytes from metadata or input content
        image_items = self._extract_image_bytes_list(security_input)

        if not image_items:
            return findings

        for idx, (filename, img_bytes) in enumerate(image_items):
            if not img_bytes:
                continue

            file_ref = filename or f"image_{idx + 1}"

            # 2. Magic bytes & signature mismatch check
            self._check_magic_bytes(file_ref, img_bytes, findings)

            # 3. Structural integrity & PIL parsing check
            pil_image = self._check_structure(file_ref, img_bytes, findings)

            # 4. Appended trailing data / polyglot check
            self._check_trailing_data(file_ref, img_bytes, findings)

            # 5. Metadata inspection for injected code or instructions
            if pil_image:
                self._check_metadata(file_ref, pil_image, findings)
                self._check_dimensions(file_ref, pil_image, findings)

        return findings

    def _extract_image_bytes_list(self, security_input: SecurityInput) -> List[Tuple[str, bytes]]:
        """Extract raw image bytes tuples (filename, bytes) from SecurityInput."""
        items: List[Tuple[str, bytes]] = []

        # A. Check metadata for raw bytes or base64
        meta = security_input.metadata or {}

        if "image_bytes" in meta and isinstance(meta["image_bytes"], bytes):
            items.append((meta.get("filename", "uploaded_image"), meta["image_bytes"]))

        if "image_base64" in meta and isinstance(meta["image_base64"], str):
            try:
                b = base64.b64decode(meta["image_base64"])
                items.append((meta.get("filename", "uploaded_image"), b))
            except Exception:
                pass

        # B. Check extracted_images list (from PDF/Document extractions)
        if "extracted_images" in meta and isinstance(meta["extracted_images"], list):
            for img_dict in meta["extracted_images"]:
                if isinstance(img_dict, dict):
                    fname = img_dict.get("filename") or img_dict.get("name") or "embedded_image"
                    if "bytes" in img_dict and isinstance(img_dict["bytes"], bytes):
                        items.append((fname, img_dict["bytes"]))
                    elif "bytes_b64" in img_dict and isinstance(img_dict["bytes_b64"], str):
                        try:
                            b = base64.b64decode(img_dict["bytes_b64"])
                            items.append((fname, b))
                        except Exception:
                            pass

        # C. Check if content itself is base64 or raw image magic header
        content = security_input.content or ""
        if content.startswith("data:image/") and ";base64," in content:
            try:
                b64_part = content.split(";base64,")[1]
                b = base64.b64decode(b64_part)
                items.append((meta.get("filename", "inline_image"), b))
            except Exception:
                pass

        return items

    def _check_magic_bytes(self, filename: str, img_bytes: bytes, findings: List[SecurityFinding]) -> None:
        """Validate header signatures against known image magic bytes and executable indicators."""
        # Executable checks (PE/MZ, ELF, Script)
        if img_bytes.startswith(b"MZ"):
            findings.append(SecurityFinding(
                category="image_security",
                severity="HIGH",
                description=f"Executable payload masquerading as image ({filename}): Windows PE/MZ header signature detected."
            ))
            return

        if img_bytes.startswith(b"\x7fELF"):
            findings.append(SecurityFinding(
                category="image_security",
                severity="HIGH",
                description=f"Executable payload masquerading as image ({filename}): Linux ELF header signature detected."
            ))
            return

        if img_bytes.startswith(b"<script") or img_bytes.startswith(b"<?php") or img_bytes.startswith(b"#!/bin/"):
            findings.append(SecurityFinding(
                category="image_security",
                severity="HIGH",
                description=f"Executable script masquerading as image ({filename}): Script header signature detected."
            ))
            return

        # Check declared extension vs signature match
        lower_name = filename.lower()
        if lower_name.endswith(".png") and not img_bytes.startswith(MAGIC_SIGNATURES["png"]):
            findings.append(SecurityFinding(
                category="image_security",
                severity="MEDIUM",
                description=f"Image format mismatch ({filename}): File extension is .png but binary magic bytes do not match PNG header."
            ))
        elif (lower_name.endswith(".jpg") or lower_name.endswith(".jpeg")) and not img_bytes.startswith(MAGIC_SIGNATURES["jpeg"]):
            findings.append(SecurityFinding(
                category="image_security",
                severity="MEDIUM",
                description=f"Image format mismatch ({filename}): File extension is JPEG but binary magic bytes do not match JPEG header."
            ))

    def _check_structure(self, filename: str, img_bytes: bytes, findings: List[SecurityFinding]) -> Optional[Image.Image]:
        """Safely parse image structure with PIL to detect corruption or malformed structure."""
        try:
            img = Image.open(io.BytesIO(img_bytes))
            img.verify()
            # Re-open after verify() because verify destroys file pointer state
            return Image.open(io.BytesIO(img_bytes))
        except UnidentifiedImageError:
            findings.append(SecurityFinding(
                category="image_security",
                severity="MEDIUM",
                description=f"Unrecognized or malformed image structure ({filename}): File cannot be parsed as a valid image format."
            ))
            return None
        except Exception as err:
            findings.append(SecurityFinding(
                category="image_security",
                severity="MEDIUM",
                description=f"Malformed or corrupted image structure ({filename}): {str(err)}"
            ))
            return None

    def _check_trailing_data(self, filename: str, img_bytes: bytes, findings: List[SecurityFinding]) -> None:
        """Inspect PNG/JPEG EOF markers for appended data polyglot payloads and calculate entropy."""
        # PNG Trailing Bytes after IEND chunk (b"IEND\xaeB\x60\x82")
        iend_pos = img_bytes.find(b"IEND\xaeB\x60\x82")
        if iend_pos != -1:
            expected_eof = iend_pos + 12
            if len(img_bytes) > expected_eof + 16:
                trailing = img_bytes[expected_eof:]
                ent = calculate_entropy(trailing)
                if ent > 7.0:
                    findings.append(SecurityFinding(
                        category="image_security",
                        severity="HIGH",
                        description=f"Possible hidden-data indicator detected ({filename}): High-entropy appended data ({len(trailing)} bytes, entropy {ent:.2f}) found after PNG IEND marker."
                    ))
                else:
                    findings.append(SecurityFinding(
                        category="image_security",
                        severity="MEDIUM",
                        description=f"Possible hidden-data indicator detected ({filename}): Trailing data ({len(trailing)} bytes) found after PNG IEND marker."
                    ))
            return

        # JPEG Trailing Bytes after EOI marker (b"\xff\xd9")
        if img_bytes.startswith(MAGIC_SIGNATURES["jpeg"]):
            last_eoi = img_bytes.rfind(b"\xff\xd9")
            if last_eoi != -1 and last_eoi < len(img_bytes) - 32:
                trailing = img_bytes[last_eoi + 2:]
                ent = calculate_entropy(trailing)
                if ent > 7.0:
                    findings.append(SecurityFinding(
                        category="image_security",
                        severity="HIGH",
                        description=f"Possible hidden-data indicator detected ({filename}): High-entropy appended payload ({len(trailing)} bytes, entropy {ent:.2f}) found after JPEG EOI marker."
                    ))
                else:
                    findings.append(SecurityFinding(
                        category="image_security",
                        severity="MEDIUM",
                        description=f"Possible hidden-data indicator detected ({filename}): Trailing data ({len(trailing)} bytes) found after JPEG EOI marker."
                    ))

    def _check_metadata(self, filename: str, img: Image.Image, findings: List[SecurityFinding]) -> None:
        """Inspect image metadata (info, Exif) for embedded code or prompt injection patterns."""
        metadata_str = ""

        # Collect info dict strings
        if hasattr(img, "info") and isinstance(img.info, dict):
            for k, v in img.info.items():
                metadata_str += f" {k}:{v}"

        # Collect Exif data if present
        try:
            exif = img.getexif()
            if exif:
                for k, v in exif.items():
                    metadata_str += f" {k}:{v}"
        except Exception:
            pass

        if not metadata_str:
            return

        meta_lower = metadata_str.lower()
        for pattern in DANGEROUS_METADATA_PATTERNS:
            if pattern in meta_lower:
                findings.append(SecurityFinding(
                    category="image_security",
                    severity="HIGH",
                    description=f"Suspicious code or instruction pattern detected in image metadata ({filename}): Matches pattern '{pattern}'."
                ))
                break

    def _check_dimensions(self, filename: str, img: Image.Image, findings: List[SecurityFinding]) -> None:
        """Inspect dimensions for decompression bomb risks or extreme aspect ratios."""
        width, height = img.size
        pixels = width * height

        if pixels > 50_000_000:
            findings.append(SecurityFinding(
                category="image_security",
                severity="MEDIUM",
                description=f"Unusual image dimensions detected ({filename}): Extreme resolution ({width}x{height}, {pixels} pixels) presents a decompression bomb risk."
            ))
        elif width > 0 and height > 0:
            aspect = max(width / height, height / width)
            if aspect > 100:
                findings.append(SecurityFinding(
                    category="image_security",
                    severity="MEDIUM",
                    description=f"Unusual image dimensions detected ({filename}): Extreme aspect ratio ({width}x{height}) detected."
                ))
