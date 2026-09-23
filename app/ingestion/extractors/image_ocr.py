"""Image validator and OCR extractor for TraceGuard AI."""

import io
import os
from typing import List
from PIL import Image

from app.ingestion.extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus


class ImageOCRExtractor(BaseExtractor):
    """
    Safely validates image formats and attempts local Optical Character Recognition (OCR).
    
    If OCR engine (Tesseract) is not installed in local environment, returns
    OCR_UNAVAILABLE with transparent messaging rather than faking extraction results.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".png", ".jpg", ".jpeg", ".webp"]

    @property
    def format_name(self) -> str:
        return "Image File (PNG / JPEG / WebP)"

    def extract(self, filename: str, content: bytes) -> ExtractionResult:
        # 1. Validate image format using PIL
        try:
            image_stream = io.BytesIO(content)
            img = Image.open(image_stream)
            img.verify()  # verify integrity
            
            # Re-open because verify() closes/invalidates the stream
            img = Image.open(io.BytesIO(content))
            width, height = img.size
            img_format = img.format or "UNKNOWN"
            img_mode = img.mode
        except Exception as e:
            return ExtractionResult(
                status=ExtractionStatus.FAILED,
                error_message=f"Invalid image file: {str(e)}",
            )

        metadata = {
            "image_format": img_format,
            "dimensions": f"{width}x{height}",
            "width": width,
            "height": height,
            "color_mode": img_mode,
        }

        # 2. Attempt OCR via pytesseract if available
        try:
            import pytesseract
            
            # Attempt image to string
            extracted_text = pytesseract.image_to_string(img)
            clean_ocr_text = (extracted_text or "").strip()

            if clean_ocr_text:
                return ExtractionResult(
                    status=ExtractionStatus.SUCCESS,
                    raw_text=clean_ocr_text,
                    metadata=metadata,
                )
            else:
                return ExtractionResult(
                    status=ExtractionStatus.PARTIAL,
                    raw_text="",
                    metadata=metadata,
                    warnings=["OCR completed but no textual characters were detected in the image."],
                )
        except Exception as e:
            # Tesseract binary not installed or failed
            return ExtractionResult(
                status=ExtractionStatus.OCR_UNAVAILABLE,
                raw_text="",
                metadata=metadata,
                warnings=[
                    "Image uploaded successfully, but OCR extraction is unavailable.",
                    f"OCR engine notice: {str(e)}",
                ],
                error_message="Image uploaded successfully, but OCR extraction is unavailable.",
            )
