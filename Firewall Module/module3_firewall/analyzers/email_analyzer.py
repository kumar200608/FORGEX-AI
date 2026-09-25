import re
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.analyzers.text_analyzer import TextAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding


class EmailAnalyzer(BaseAnalyzer):
    """Analyzer for email message content, headers, and metadata."""

    PHISHING_PATTERNS = [
        (
            r"(verify|update|confirm)\s+(your|account)\s+(password|credentials|payment|security)",
            "credential_harvesting",
            "Urgent request to verify or update account password or credentials.",
        ),
        (
            r"(urgent|immediate)\s+(action|attention)\s+(required|needed)",
            "urgency_tactic",
            "Urgency tactic attempting to force immediate action without verification.",
        ),
        (
            r"(account|access)\s+will\s+be\s+(suspended|terminated|locked)",
            "account_threat",
            "Threat of account suspension or locking used in phishing attempts.",
        ),
    ]

    URL_PATTERN = r"https?://[^\s<>\"]+|www\.[^\s<>\"]+"
    SUSPICIOUS_DOMAIN_PATTERN = r"(bit\.ly|tinyurl\.com|evil\.com|phish\.net|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"

    def __init__(self):
        self.text_analyzer = TextAnalyzer()

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        content = security_input.content
        metadata = security_input.metadata

        if not content and not metadata:
            return findings

        content_lower = content.lower()

        # 1. Phishing analysis
        for pattern, subcat, desc in self.PHISHING_PATTERNS:
            if re.search(pattern, content_lower, re.IGNORECASE):
                findings.append(
                    SecurityFinding(
                        category="phishing",
                        severity="HIGH",
                        description=f"[{subcat}] {desc}",
                    )
                )

        # 2. Suspicious sender/header checks via metadata
        sender = str(metadata.get("sender", "")).lower()
        reply_to = str(metadata.get("reply_to", "")).lower()
        spf_status = str(metadata.get("spf", "")).lower()

        if spf_status == "fail":
            findings.append(
                SecurityFinding(
                    category="suspicious_sender",
                    severity="HIGH",
                    description="Email header SPF validation failed (possible sender spoofing).",
                )
            )

        if sender and reply_to and sender != reply_to:
            findings.append(
                SecurityFinding(
                    category="suspicious_sender",
                    severity="MEDIUM",
                    description=f"Sender domain ({sender}) mismatch with Reply-To header ({reply_to}).",
                )
            )

        # 3. Suspicious URLs in email body
        urls = re.findall(self.URL_PATTERN, content, re.IGNORECASE)
        for url in urls:
            if re.search(self.SUSPICIOUS_DOMAIN_PATTERN, url, re.IGNORECASE):
                findings.append(
                    SecurityFinding(
                        category="suspicious_url",
                        severity="MEDIUM",
                        description=f"Email contains suspicious destination URL: {url}",
                    )
                )

        # 4. Indirect prompt injection in email content
        text_findings = self.text_analyzer.analyze(security_input)
        findings.extend(text_findings)

        return findings
