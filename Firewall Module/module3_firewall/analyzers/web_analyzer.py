import re
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.analyzers.text_analyzer import TextAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding


class WebAnalyzer(BaseAnalyzer):
    """Analyzer for scraped web page HTML/text content."""

    HIDDEN_INSTRUCTION_PATTERNS = [
        (
            r"style=[\"'].*?(display:\s*none|visibility:\s*hidden|font-size:\s*0|opacity:\s*0).*?[\"']",
            "hidden_css_injection",
            "Detected hidden DOM element styling likely concealing indirect instructions.",
        ),
        (
            r"<!--\s*.*?(ignore|override|system\s+prompt|send\s+email|execute).*?\s*-->",
            "html_comment_injection",
            "Detected HTML comment containing indirect prompt injection payload.",
        ),
    ]

    URL_PATTERN = r"https?://[^\s<>\"]+|www\.[^\s<>\"]+"
    SUSPICIOUS_DOMAIN_PATTERN = r"(bit\.ly|tinyurl\.com|evil\.com|phish\.net|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"

    PHISHING_PATTERNS = [
        (
            r"(enter|login|submit)\s+(your|account)\s+(password|credentials|ssn|social\s+security)",
            "credential_harvesting_form",
            "Scraped web page contains credential harvesting form or prompt.",
        ),
    ]

    def __init__(self):
        self.text_analyzer = TextAnalyzer()

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        content = security_input.content

        if not content:
            return findings

        # 1. Hidden instruction detection (HTML comments, hidden CSS)
        for pattern, tag, desc in self.HIDDEN_INSTRUCTION_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                findings.append(
                    SecurityFinding(
                        category="prompt_injection",
                        severity="HIGH",
                        description=f"[{tag}] {desc}",
                    )
                )

        # 2. Phishing detection on web content
        for pattern, tag, desc in self.PHISHING_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                findings.append(
                    SecurityFinding(
                        category="phishing",
                        severity="HIGH",
                        description=f"[{tag}] {desc}",
                    )
                )

        # 3. Suspicious URLs in web content
        urls = re.findall(self.URL_PATTERN, content, re.IGNORECASE)
        for url in urls:
            if re.search(self.SUSPICIOUS_DOMAIN_PATTERN, url, re.IGNORECASE):
                findings.append(
                    SecurityFinding(
                        category="suspicious_url",
                        severity="MEDIUM",
                        description=f"Web content contains suspicious domain link: {url}",
                    )
                )

        # 4. Prompt injection analysis on text
        text_findings = self.text_analyzer.analyze(security_input)
        findings.extend(text_findings)

        return findings
