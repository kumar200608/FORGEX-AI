import re
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.analyzers.text_analyzer import TextAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding


class PDFAnalyzer(BaseAnalyzer):
    """Analyzer for machine-readable PDF content and metadata."""

    PDF_SCRIPT_PATTERNS = [
        (r"/JS\b|/JavaScript\b", "embedded_javascript", "Contains embedded PDF JavaScript triggers."),
        (r"/AA\b|/OpenAction\b", "auto_action", "Contains automatic document launch or open actions."),
    ]

    URL_PATTERN = r"https?://[^\s<>\"]+|www\.[^\s<>\"]+"
    SUSPICIOUS_DOMAIN_PATTERN = r"(bit\.ly|tinyurl\.com|evil\.com|phish\.net|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"

    MALWARE_INDICATORS = [
        ("eicar-standard-antivirus-test-file", "EICAR test malware signature detected."),
        ("malware_detected", "Input metadata or content indicates malware scan positive."),
        ("virus_found", "Input explicitly contains virus scan detection indicator."),
    ]

    def __init__(self):
        self.text_analyzer = TextAnalyzer()

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        content = security_input.content
        metadata = security_input.metadata

        if not content and not metadata:
            return findings

        # 1. Check for PDF-specific executable script/action objects
        for pattern, tag, desc in self.PDF_SCRIPT_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE) or any(
                re.search(pattern, str(v), re.IGNORECASE) for v in metadata.values()
            ):
                findings.append(
                    SecurityFinding(
                        category="suspicious_content",
                        severity="MEDIUM",
                        description=f"[{tag}] {desc}",
                    )
                )

        # 2. Check for suspicious URLs / IPs
        urls = re.findall(self.URL_PATTERN, content, re.IGNORECASE)
        for url in urls:
            if re.search(self.SUSPICIOUS_DOMAIN_PATTERN, url, re.IGNORECASE):
                findings.append(
                    SecurityFinding(
                        category="suspicious_url",
                        severity="MEDIUM",
                        description=f"PDF contains suspicious URL or untrusted IP: {url}",
                    )
                )

        # 3. Check for malware markers in text or scan metadata
        content_lower = content.lower()
        metadata_str = str(metadata).lower()
        for marker, desc in self.MALWARE_INDICATORS:
            if marker in content_lower or marker in metadata_str:
                findings.append(
                    SecurityFinding(
                        category="malware_indicator",
                        severity="HIGH",
                        description=desc,
                    )
                )

        # 4. Prompt injection analysis on PDF text content
        text_findings = self.text_analyzer.analyze(security_input)
        findings.extend(text_findings)

        return findings
