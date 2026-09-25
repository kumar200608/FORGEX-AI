import re
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding


class TextAnalyzer(BaseAnalyzer):
    """Analyzer for plain text inputs, searching for indirect prompt injection patterns."""

    PROMPT_INJECTION_PATTERNS = [
        (
            r"(system\s+override|\[system\s+override\]|override\s+system)",
            "system_override",
            "Attempts to execute a system override on agent directives.",
        ),
        (
            r"(ignore|disregard|forget)\s+.*?\b(instructions|directives|rules|prompts|security policies|policies|request)\b",
            "override_instruction",
            "Attempts to override agent system directives by commanding it to ignore instructions.",
        ),
        (
            r"(override|bypass|disable)\s+.*?\b(security|guardrails|safety|rules|controls|checks|policy)\b",
            "security_bypass",
            "Attempts to command agent to bypass security guardrails or controls.",
        ),
        (
            r"(reveal|print|show|output|display|disclose)\s+.*?\b(confidential|system\s+prompt|secret|credentials|api\s+key)\b",
            "data_exfiltration",
            "Attempts to extract confidential system prompts or credentials.",
        ),
        (
            r"(send|forward|transfer|make|execute|request|trigger)\s+.*?\b(email|information|data|money|funds|payment|tool)\b",
            "unauthorized_action",
            "Contains suspicious commands instructing agent to execute sensitive actions or tools.",
        ),
        (
            r"(treat|consider|has|this document|these instructions)\s+.*?\b(administrator|admin|higher|top|primary|highest)\s+(authority|priority)",
            "priority_hijack",
            "Attempts to hijack instruction priority hierarchy.",
        ),
        (
            r"do\s+not\s+(ask|inform|notify|disclose|request|confirm)\b",
            "suppress_confirmation",
            "Attempts to suppress user confirmation or disclosure.",
        ),
        (
            r"immediately\s+(perform|execute|request|trigger|send|make)\b",
            "immediate_execution",
            "Attempts to force immediate action execution.",
        ),
        (
            r"hidden\s+(instruction|command|directive|prompt)",
            "covert_instruction",
            "Contains hidden instructions attempting to control the agent.",
        ),
    ]

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        content = security_input.content.lower()

        if not content.strip():
            return findings

        for pattern, subcat, description in self.PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                findings.append(
                    SecurityFinding(
                        category="prompt_injection",
                        severity="HIGH",
                        description=f"[{subcat}] {description}",
                    )
                )

        return findings

