import io
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding

try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PdfReader = None
    PYPDF_AVAILABLE = False


class PDFSecurityAnalyzer(BaseAnalyzer):
    """Local PDF structural and object inspection using pypdf."""

    def __init__(self):
        self.available = PYPDF_AVAILABLE

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []

        if security_input.source_type != "pdf" and getattr(security_input.source_type, "value", None) != "pdf":
            # Also run if metadata explicitly indicates pdf file_type
            if str(security_input.metadata.get("file_type", "")).lower() != "pdf":
                return findings

        raw_bytes = security_input.metadata.get("bytes")
        content = security_input.content

        # 1. Structural inspection via pypdf if bytes provided
        if self.available and raw_bytes and isinstance(raw_bytes, bytes):
            try:
                reader = PdfReader(io.BytesIO(raw_bytes))

                # Inspect catalog / root dict
                root = reader.trailer.get("/Root", {})

                # Check OpenAction / Auto Action
                if "/OpenAction" in root or "/AA" in root:
                    findings.append(
                        SecurityFinding(
                            category="PDF_SECURITY",
                            severity="HIGH",
                            description="[pypdf] Auto-executing /OpenAction or /AA trigger detected in PDF structure.",
                        )
                    )

                # Check JavaScript in Names catalog or root
                names = root.get("/Names", {})
                if "/JavaScript" in names or "/JS" in root or "/JavaScript" in root:
                    findings.append(
                        SecurityFinding(
                            category="PDF_SECURITY",
                            severity="HIGH",
                            description="[pypdf] Embedded JavaScript actions (/JS or /JavaScript) detected in PDF catalog.",
                        )
                    )

                # Check for Launch actions
                for page in reader.pages:
                    if "/Annots" in page:
                        annots = page["/Annots"]
                        for annot in annots:
                            obj = annot.get_object() if hasattr(annot, "get_object") else annot
                            if isinstance(obj, dict):
                                A = obj.get("/A", {})
                                if isinstance(A, dict) and A.get("/S") == "/Launch":
                                    findings.append(
                                        SecurityFinding(
                                            category="PDF_SECURITY",
                                            severity="HIGH",
                                            description="[pypdf] External program launch action (/Launch) detected in PDF page annotations.",
                                        )
                                    )

                # Check embedded attachments
                if "/EmbeddedFiles" in names or "/Filespec" in root:
                    findings.append(
                        SecurityFinding(
                            category="PDF_SECURITY",
                            severity="MEDIUM",
                            description="[pypdf] Embedded file attachments detected inside PDF document.",
                        )
                    )

            except Exception as e:
                # Handle corrupted PDF or parse errors safely
                pass

        # 2. Text / Metadata fallback analysis
        content_lower = content.lower()
        metadata_str = str(security_input.metadata).lower()

        if "/openaction" in content_lower or "/openaction" in metadata_str or "/aa" in content_lower:
            findings.append(
                SecurityFinding(
                    category="PDF_SECURITY",
                    severity="HIGH",
                    description="Auto-executing PDF OpenAction trigger detected.",
                )
            )

        if "/javascript" in content_lower or "/js" in content_lower or "javascript" in metadata_str:
            findings.append(
                SecurityFinding(
                    category="PDF_SECURITY",
                    severity="HIGH",
                    description="Embedded JavaScript object detected in PDF content.",
                )
            )

        if "/launch" in content_lower or "/launch" in metadata_str:
            findings.append(
                SecurityFinding(
                    category="PDF_SECURITY",
                    severity="HIGH",
                    description="Suspicious PDF /Launch action trigger detected.",
                )
            )

        # De-duplicate findings
        unique_findings = []
        seen = set()
        for f in findings:
            key = (f.category, f.description)
            if key not in seen:
                seen.add(key)
                unique_findings.append(f)

        return unique_findings
