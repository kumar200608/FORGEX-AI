import re
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding

try:
    from oletools.olevba import VBA_Parser
    import oletools.rtfobj as rtfobj
    OLETOOLS_AVAILABLE = True
except Exception:
    VBA_Parser = None
    rtfobj = None
    OLETOOLS_AVAILABLE = False


class OfficeAnalyzer(BaseAnalyzer):
    """Analyzer for Office/OLE/RTF documents detecting VBA macros, auto-exec macros, and embedded objects using oletools."""

    OFFICE_EXTENSIONS = (
        ".doc", ".docx", ".docm", ".dotm",
        ".xls", ".xlsx", ".xlsm", ".xlsb",
        ".ppt", ".pptx", ".pptm", ".rtf",
    )

    SUSPICIOUS_MACRO_KEYWORDS = [
        ("autoopen", "AutoOpen execution macro detected."),
        ("autoexec", "AutoExec execution macro detected."),
        ("document_open", "Document_Open execution macro detected."),
        ("workbook_open", "Workbook_Open execution macro detected."),
        ("shell", "Suspicious Shell command invocation keyword in macro."),
        ("wscript", "WScript execution object reference in macro."),
        ("createobject", "Dynamic CreateObject instantiation in macro."),
        ("urldownloadtofile", "Network file download function (URLDownloadToFile) in macro."),
        ("virtualalloc", "Memory allocation function (VirtualAlloc) in macro."),
        ("powershell", "PowerShell invocation keyword in macro."),
    ]

    def __init__(self):
        self.available = OLETOOLS_AVAILABLE

    def is_supported(self, security_input: SecurityInput) -> bool:
        meta = security_input.metadata
        file_type = str(meta.get("file_type", "")).lower()
        filename = str(meta.get("filename", "")).lower()

        if file_type in ("office", "ole", "vba", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf"):
            return True

        if filename and filename.endswith(self.OFFICE_EXTENSIONS):
            return True

        if "bytes" in meta or "vba_code" in meta:
            return True

        # Check content text for obvious RTF / OLE headers or text mentions of VBA
        content = security_input.content
        if content.startswith("{\\rtf") or "Attribute VB_Name" in content or "Sub AutoOpen" in content:
            return True

        return False

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []

        if not self.is_supported(security_input):
            return findings

        meta = security_input.metadata
        raw_bytes = meta.get("bytes")
        content = security_input.content
        vba_code_meta = meta.get("vba_code")

        # 1. Direct text/meta inspection for macro keywords (safe fallback/supplement)
        macro_text = ""
        if vba_code_meta:
            macro_text += str(vba_code_meta) + "\n"
        if content:
            macro_text += content + "\n"

        if macro_text:
            macro_lower = macro_text.lower()
            if "sub " in macro_lower or "function " in macro_lower or "attribute vb_name" in macro_lower or "autoopen" in macro_lower:
                findings.append(
                    SecurityFinding(
                        category="MACRO",
                        severity="MEDIUM",
                        description="VBA macro code detected in document.",
                    )
                )

            for kw, desc in self.SUSPICIOUS_MACRO_KEYWORDS:
                if kw in macro_lower:
                    severity = "HIGH" if kw in ("autoopen", "autoexec", "document_open", "shell", "powershell", "urldownloadtofile") else "MEDIUM"
                    findings.append(
                        SecurityFinding(
                            category="MACRO",
                            severity=severity,
                            description=f"[Macro Keyword] {desc}",
                        )
                    )

        # 2. Oletools VBA_Parser inspection on raw_bytes if present
        if raw_bytes and isinstance(raw_bytes, bytes) and VBA_Parser:
            try:
                vba = VBA_Parser(filename="sample.bin", data=raw_bytes)
                if vba.detect_vba_macros():
                    findings.append(
                        SecurityFinding(
                            category="MACRO",
                            severity="MEDIUM",
                            description="VBA_Parser detected embedded VBA macros in document.",
                        )
                    )
                    results = vba.analyze_macros()
                    if results:
                        for kw_type, keyword, description in results:
                            if kw_type in ("AutoExec", "Suspicious"):
                                findings.append(
                                    SecurityFinding(
                                        category="MACRO",
                                        severity="HIGH",
                                        description=f"[oletools] {kw_type}: {keyword} - {description}",
                                    )
                                )
                vba.close()
            except Exception:
                pass

        # De-duplicate findings by description
        unique_findings = []
        seen_desc = set()
        for f in findings:
            if f.description not in seen_desc:
                seen_desc.add(f.description)
                unique_findings.append(f)

        return unique_findings
