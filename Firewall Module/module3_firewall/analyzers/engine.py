import uuid
from typing import Dict, List, Optional
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.analyzers.pdf_analyzer import PDFAnalyzer
from module3_firewall.analyzers.email_analyzer import EmailAnalyzer
from module3_firewall.analyzers.web_analyzer import WebAnalyzer
from module3_firewall.analyzers.text_analyzer import TextAnalyzer

from module3_firewall.analyzers.yara_analyzer import YaraAnalyzer
from module3_firewall.analyzers.clamav_analyzer import ClamAVAnalyzer
from module3_firewall.analyzers.office_analyzer import OfficeAnalyzer
from module3_firewall.analyzers.pe_analyzer import PEAnalyzer
from module3_firewall.analyzers.pdf_security_analyzer import PDFSecurityAnalyzer
from module3_firewall.analyzers.url_security_analyzer import URLSecurityAnalyzer
from module3_firewall.analyzers.image_security_analyzer import ImageSecurityAnalyzer

from module3_firewall.taint.engine import TaintEngine
from module3_firewall.models.security import (
    SecurityInput,
    SecurityFinding,
    SourceType,
    RiskLevel,
    AnalysisResponse,
    TaintMetadata,
)


class SecurityAnalysisEngine:
    """Unified engine for source dispatching, static security analysis, taint tagging, and risk scoring."""

    def __init__(self, taint_engine: Optional[TaintEngine] = None):
        self.taint_engine = taint_engine or TaintEngine()

        # Existing primary analyzers
        self._analyzers: Dict[SourceType, BaseAnalyzer] = {
            SourceType.PDF: PDFAnalyzer(),
            SourceType.EMAIL: EmailAnalyzer(),
            SourceType.WEB: WebAnalyzer(),
            SourceType.TEXT: TextAnalyzer(),
        }

        # Extra local security analyzers
        self.yara_analyzer = YaraAnalyzer()
        self.clamav_analyzer = ClamAVAnalyzer()
        self.office_analyzer = OfficeAnalyzer()
        self.pe_analyzer = PEAnalyzer()
        self.pdf_security_analyzer = PDFSecurityAnalyzer()
        self.url_security_analyzer = URLSecurityAnalyzer()
        self.image_security_analyzer = ImageSecurityAnalyzer()

    def analyze(self, security_input: SecurityInput) -> AnalysisResponse:
        """Process input through source-specific analyzer, extra local security analyzers, apply taint tracking, and compute risk response."""
        primary_analyzer = self._analyzers.get(security_input.source_type)
        if not primary_analyzer:
            primary_analyzer = TextAnalyzer()

        # 1. Run primary custom analyzer
        findings: List[SecurityFinding] = primary_analyzer.analyze(security_input)

        # 2. Dispatch to extra local security analyzers based on source and content indicators
        extra_findings: List[SecurityFinding] = []

        # YARA (runs across all inputs where rules match)
        extra_findings.extend(self.yara_analyzer.analyze(security_input))

        # ClamAV (runs across inputs where content/bytes exist)
        extra_findings.extend(self.clamav_analyzer.analyze(security_input))

        # Office / OLE analyzer (runs for Office files, macros, OLE/RTF content)
        extra_findings.extend(self.office_analyzer.analyze(security_input))

        # PE executable analyzer (runs for PE binaries/files)
        extra_findings.extend(self.pe_analyzer.analyze(security_input))

        # PDF structural security analyzer (runs for PDF sources)
        extra_findings.extend(self.pdf_security_analyzer.analyze(security_input))

        # Image Security analyzer (runs for raw image bytes, extracted images, or metadata images)
        extra_findings.extend(self.image_security_analyzer.analyze(security_input))

        # URL / DNS / HTML analyzer (runs for Web, Email, and content containing URLs/HTML)
        src_val = str(security_input.source_type.value if hasattr(security_input.source_type, 'value') else security_input.source_type).lower()
        if src_val in ("web", "email") or "http" in security_input.content or "<html" in security_input.content.lower():
            extra_findings.extend(self.url_security_analyzer.analyze(security_input))

        # Merge findings cleanly without exact duplicates
        combined_findings = list(findings)
        seen_keys = {(f.category.lower(), f.description) for f in findings}

        for f in extra_findings:
            key = (f.category.lower(), f.description)
            if key not in seen_keys:
                seen_keys.add(key)
                combined_findings.append(f)

        risk_level = self.calculate_risk(combined_findings)

        request_id = security_input.metadata.get(
            "request_id", f"req_{uuid.uuid4().hex[:8]}"
        )

        # Apply Taint Tracking for untrusted external content
        taint_record = self.taint_engine.create_taint(
            source_type=str(security_input.source_type.value if hasattr(security_input.source_type, 'value') else security_input.source_type),
            source_reference=request_id,
            reason="external_untrusted_content",
        )
        self.taint_engine.assign_taint(
            data_key=request_id,
            taint_record=taint_record,
            trace_step="EXTRACTED_CONTENT",
        )

        taint_meta = TaintMetadata(
            taint_id=taint_record.taint_id,
            source_type=taint_record.source_type,
            source_reference=taint_record.source_reference,
            reason=taint_record.reason,
        )

        trace = self.taint_engine.get_provenance_trace(request_id)

        return AnalysisResponse(
            request_id=request_id,
            source_type=security_input.source_type,
            is_untrusted=True,  # All external inputs are untrusted by default
            taint=taint_meta,
            findings=combined_findings,
            risk_level=risk_level,
            trace=trace,
        )

    def calculate_risk(self, findings: List[SecurityFinding]) -> RiskLevel:
        """Calculate a simple, deterministic risk score from security findings."""
        if not findings:
            return RiskLevel.LOW

        has_high_severity = any(f.severity.upper() == "HIGH" for f in findings)
        category_set = {f.category.lower() for f in findings}

        high_risk_categories = {
            "malware_indicator", "malware", "prompt_injection", "phishing",
            "suspicious_script", "suspicious_payload", "macro", "pe_analysis", "image_security"
        }

        if (
            has_high_severity
            or bool(category_set.intersection(high_risk_categories))
            or len(findings) >= 2
        ):
            return RiskLevel.HIGH

        return RiskLevel.MEDIUM

    def get_scanners_status(self) -> Dict[str, str]:
        """Return status summary of all optional local security scanners."""
        return {
            "yara": "available" if self.yara_analyzer.is_available() else "unavailable",
            "clamav": self.clamav_analyzer.get_scanner_status(),
            "oletools": "available" if self.office_analyzer.available else "unavailable",
            "pefile": "available" if self.pe_analyzer.available else "unavailable",
            "pypdf": "available" if self.pdf_security_analyzer.available else "unavailable",
            "url_dns": "available",
        }
