import os
from pathlib import Path
from typing import List, Dict, Optional
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding

try:
    import yara
    YARA_AVAILABLE = True
except ImportError:
    yara = None
    YARA_AVAILABLE = False


class YaraAnalyzer(BaseAnalyzer):
    """Analyzer using local yara-python rules for pattern matching, scripts, and payloads."""

    def __init__(self, rules_dir: Optional[str] = None):
        self.available = YARA_AVAILABLE
        self.rules: Optional[yara.Rules] = None
        self.last_status: str = "ok"

        if self.available:
            try:
                if rules_dir is None:
                    # Default path relative to this file
                    base_path = Path(__file__).parent.parent / "security_rules" / "yara"
                else:
                    base_path = Path(rules_dir)

                rule_filepaths: Dict[str, str] = {}
                if base_path.exists() and base_path.is_dir():
                    for yar_file in base_path.glob("*.yar"):
                        rule_filepaths[yar_file.stem] = str(yar_file)

                if rule_filepaths:
                    self.rules = yara.compile(filepaths=rule_filepaths)
                else:
                    self.available = False
                    self.last_status = "no_rules_found"
            except Exception as e:
                self.available = False
                self.last_status = f"compile_error: {str(e)}"

    def is_available(self) -> bool:
        return self.available and self.rules is not None

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []

        if not self.is_available():
            # If YARA is unavailable, gracefully return no findings (or scanner unavailable status when checked)
            return findings

        content = security_input.content
        if not content and "bytes" not in security_input.metadata:
            return findings

        try:
            matches = []
            if "bytes" in security_input.metadata and isinstance(security_input.metadata["bytes"], bytes):
                matches = self.rules.match(data=security_input.metadata["bytes"])
            elif content:
                matches = self.rules.match(data=content.encode("utf-8", errors="ignore"))

            for match in matches:
                rule_name = match.rule
                meta = match.meta or {}
                desc = meta.get("description", f"Matched YARA rule: {rule_name}")
                severity = meta.get("severity", "HIGH")

                category = "SUSPICIOUS_SCRIPT"
                if "prompt" in rule_name.lower() or "injection" in rule_name.lower():
                    category = "PROMPT_INJECTION"
                elif "payload" in rule_name.lower() or "eicar" in rule_name.lower():
                    category = "SUSPICIOUS_PAYLOAD"

                findings.append(
                    SecurityFinding(
                        category=category,
                        severity=severity,
                        description=f"[YARA:{rule_name}] {desc}",
                    )
                )
        except Exception as e:
            # Prevent crash during scan error
            pass

        return findings
