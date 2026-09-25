import socket
import shutil
import subprocess
import tempfile
import os
from typing import List, Tuple
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding


class ClamAVAnalyzer(BaseAnalyzer):
    """Optional adapter for local ClamAV daemon (clamd socket) or clamscan command."""

    def __init__(self, host: str = "127.0.0.1", port: int = 3310):
        self.host = host
        self.port = port
        self.status = "unavailable"
        self._socket_available = False
        self._check_availability()

    def _check_availability(self):
        """Detect whether local ClamAV service or clamscan binary is available."""
        # 1. Try socket ping to clamd
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.2)
                s.connect((self.host, self.port))
                s.sendall(b"PING\n")
                response = s.recv(1024)
                if b"PONG" in response:
                    self.status = "available"
                    self._socket_available = True
                    return
        except Exception:
            pass

        self._socket_available = False

        # If a specific scanner host/port endpoint was specified and is unreachable, report unavailable
        if self.host != "127.0.0.1" or self.port != 3310:
            self.status = "unavailable"
            return

        # 2. Check if clamscan executable is in system PATH (for default scanner)
        if shutil.which("clamscan"):
            self.status = "available"
        else:
            self.status = "unavailable"

    def is_available(self) -> bool:
        return self.status == "available"

    def get_scanner_status(self) -> str:
        return self.status

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []

        if not self.is_available():
            return findings

        content = security_input.content
        raw_bytes = security_input.metadata.get("bytes")

        if not content and not raw_bytes:
            return findings

        # Perform local scan via socket stream or clamscan binary
        try:
            scanned, virus_name = self._scan_content(content, raw_bytes)
            if scanned and virus_name:
                findings.append(
                    SecurityFinding(
                        category="MALWARE",
                        severity="HIGH",
                        description=f"[ClamAV] Malicious signature detected: {virus_name}",
                    )
                )
        except Exception:
            # Graceful error handling - do not crash firewall
            pass

        return findings

    def _scan_content(self, content: str, raw_bytes: bytes = None) -> Tuple[bool, str]:
        """Scan content bytes using clamd socket INSTREAM or clamscan CLI."""
        data_to_scan = raw_bytes if raw_bytes else content.encode("utf-8", errors="ignore")

        # Try socket INSTREAM first if socket daemon is available
        if self._socket_available:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2.0)
                    s.connect((self.host, self.port))
                    s.sendall(b"zINSTREAM\0")

                    # Send chunk size + chunk data
                    size = len(data_to_scan)
                    s.sendall(size.to_bytes(4, byteorder="big") + data_to_scan)
                    s.sendall((0).to_bytes(4, byteorder="big"))  # Zero size chunk ends stream

                    response = s.recv(4096).decode("utf-8", errors="ignore")
                    if "FOUND" in response:
                        # Format: stream: VirusName FOUND
                        parts = response.split(":")
                        virus_name = parts[1].replace("FOUND", "").strip() if len(parts) > 1 else "Malware.Detected"
                        return True, virus_name
                    return True, ""
            except Exception:
                pass

        # Fallback to clamscan binary if available
        if shutil.which("clamscan"):
            try:
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    tmp.write(data_to_scan)
                    tmp_path = tmp.name

                try:
                    res = subprocess.run(
                        ["clamscan", "--no-summary", tmp_path],
                        capture_output=True,
                        text=True,
                        timeout=5,
                    )
                    if res.returncode == 1:  # Virus found
                        output = res.stdout
                        parts = output.split(":")
                        virus_name = parts[1].replace("FOUND", "").strip() if len(parts) > 1 else "Malware.Detected"
                        return True, virus_name
                    return True, ""
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
            except Exception:
                pass

        return False, ""
