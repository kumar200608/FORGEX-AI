import io
from typing import List
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding

try:
    import pefile
    PEFILE_AVAILABLE = True
except ImportError:
    pefile = None
    PEFILE_AVAILABLE = False


class PEAnalyzer(BaseAnalyzer):
    """PE/EXE/DLL structural analyzer using pefile."""

    SUSPICIOUS_IMPORTS = {
        "VirtualAlloc", "VirtualAllocEx", "VirtualProtect",
        "WriteProcessMemory", "CreateRemoteThread", "RtlCreateUserThread",
        "URLDownloadToFileA", "URLDownloadToFileW", "InternetOpenA", "InternetOpenW",
        "WinExec", "ShellExecuteA", "ShellExecuteW", "HttpSendRequestA",
    }

    PE_EXTENSIONS = (".exe", ".dll", ".sys", ".scr", ".drv", ".cpl")

    def __init__(self):
        self.available = PEFILE_AVAILABLE

    def is_pe_file(self, security_input: SecurityInput) -> bool:
        meta = security_input.metadata
        file_type = str(meta.get("file_type", "")).lower()
        filename = str(meta.get("filename", "")).lower()
        raw_bytes = meta.get("bytes")

        if file_type in ("pe", "exe", "dll", "executable"):
            return True

        if filename and filename.endswith(self.PE_EXTENSIONS):
            return True

        if isinstance(raw_bytes, bytes) and raw_bytes.startswith(b"MZ"):
            return True

        # Check if text content looks like a mock PE description or raw MZ signature
        content = security_input.content
        if content.startswith("MZ") or "DOS header" in content or "PE header" in content:
            return True

        return False

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []

        if not self.is_pe_file(security_input):
            return findings

        if not self.available:
            # If pefile isn't installed but it's a PE file, perform simple text/byte header inspection
            return self._fallback_analyze(security_input)

        raw_bytes = security_input.metadata.get("bytes")
        content = security_input.content

        pe_data = raw_bytes
        if not pe_data and content.startswith("MZ"):
            pe_data = content.encode("utf-8", errors="ignore")

        if not pe_data:
            return self._fallback_analyze(security_input)

        try:
            pe = pefile.PE(data=pe_data, fast_load=True)
            pe.parse_data_directories()

            findings.append(
                SecurityFinding(
                    category="PE_ANALYSIS",
                    severity="LOW",
                    description="Valid PE (Portable Executable) binary structure identified.",
                )
            )

            # Check suspicious section characteristics (Executable + Writable)
            for section in pe.sections:
                sec_name = section.Name.decode("utf-8", errors="ignore").rstrip("\x00")
                # IMAGE_SCN_MEM_EXECUTE (0x20000000) and IMAGE_SCN_MEM_WRITE (0x80000000)
                if (section.Characteristics & 0x20000000) and (section.Characteristics & 0x80000000):
                    findings.append(
                        SecurityFinding(
                            category="PE_ANALYSIS",
                            severity="HIGH",
                            description=f"Suspicious PE section '{sec_name}': Executable and Writable memory permissions.",
                        )
                    )

            # Check imports
            if hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
                found_suspicious_imports = []
                for entry in pe.DIRECTORY_ENTRY_IMPORT:
                    for imp in entry.imports:
                        if imp.name:
                            imp_name = imp.name.decode("utf-8", errors="ignore")
                            if imp_name in self.SUSPICIOUS_IMPORTS:
                                found_suspicious_imports.append(imp_name)

                if found_suspicious_imports:
                    findings.append(
                        SecurityFinding(
                            category="PE_ANALYSIS",
                            severity="HIGH",
                            description=f"Suspicious PE API imports detected: {', '.join(set(found_suspicious_imports))}",
                        )
                    )

        except Exception as e:
            findings.append(
                SecurityFinding(
                    category="PE_ANALYSIS",
                    severity="MEDIUM",
                    description=f"Malformed or custom PE header structure: {str(e)}",
                )
            )

        return findings

    def _fallback_analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        """Fallback analysis when pefile is unavailable or raw binary bytes are absent."""
        findings: List[SecurityFinding] = []
        content = security_input.content.lower()
        meta_str = str(security_input.metadata).lower()

        findings.append(
            SecurityFinding(
                category="PE_ANALYSIS",
                severity="MEDIUM",
                description="Executable PE input file detected.",
            )
        )

        for imp in self.SUSPICIOUS_IMPORTS:
            if imp.lower() in content or imp.lower() in meta_str:
                findings.append(
                    SecurityFinding(
                        category="PE_ANALYSIS",
                        severity="HIGH",
                        description=f"Suspicious PE API import keyword detected: {imp}",
                    )
                )

        return findings
