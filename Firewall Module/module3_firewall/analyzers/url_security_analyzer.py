import re
from typing import List, Set
from module3_firewall.analyzers.base import BaseAnalyzer
from module3_firewall.models.security import SecurityInput, SecurityFinding

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BeautifulSoup = None
    BS4_AVAILABLE = False

try:
    import tldextract
    TLD_AVAILABLE = True
except ImportError:
    tldextract = None
    TLD_AVAILABLE = False

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    dns = None
    DNS_AVAILABLE = False


class URLSecurityAnalyzer(BaseAnalyzer):
    """Local HTML parsing (bs4), domain breakdown (tldextract), and DNS resolution (dnspython)."""

    URL_REGEX = r"https?://[^\s<>\"]+|www\.[^\s<>\"]+"
    IP_URL_REGEX = r"https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    SUSPICIOUS_TLDS = {"zip", "mov", "top", "xyz", "work", "tk", "ml", "ga", "cf", "gq", "phish"}

    def __init__(self, perform_dns: bool = True):
        self.perform_dns = perform_dns

    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        content = security_input.content
        meta = security_input.metadata

        if not content and not meta:
            return findings

        # 1. BeautifulSoup HTML inspection (hidden content, forms, comments)
        if BS4_AVAILABLE and content and ("<html" in content.lower() or "<form" in content.lower() or "<!--" in content or "style=" in content.lower()):
            findings.extend(self._analyze_html(content))
        elif content:
            # Fallback regex HTML check
            findings.extend(self._fallback_html_check(content))

        # 2. Extract URLs from content and metadata
        urls: Set[str] = set(re.findall(self.URL_REGEX, content, re.IGNORECASE))
        if "url" in meta:
            urls.add(str(meta["url"]))

        for url in urls:
            findings.extend(self._analyze_url_structure(url))

        return findings

    def _analyze_html(self, html_content: str) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        try:
            soup = BeautifulSoup(html_content, "html.parser")

            # Check hidden styling in elements
            hidden_elements = soup.find_all(
                style=re.compile(r"display:\s*none|visibility:\s*hidden|font-size:\s*0|opacity:\s*0", re.I)
            )
            for elem in hidden_elements:
                elem_text = elem.get_text(strip=True)
                findings.append(
                    SecurityFinding(
                        category="HIDDEN_CONTENT",
                        severity="MEDIUM",
                        description=f"[BS4] Hidden HTML DOM element detected containing text: '{elem_text[:60]}...'",
                    )
                )

                if any(kw in elem_text.lower() for kw in ["ignore", "override", "system prompt", "send email", "bypass"]):
                    findings.append(
                        SecurityFinding(
                            category="PROMPT_INJECTION",
                            severity="HIGH",
                            description="Hidden HTML element contains prompt injection payload.",
                        )
                    )

            # Check HTML comments
            for string_elem in soup.find_all(string=True):
                if hasattr(string_elem, "PREFIX") or "comment" in str(type(string_elem)).lower():
                    comment_str = str(string_elem).strip()
                    if any(kw in comment_str.lower() for kw in ["ignore", "override", "system prompt", "execute", "bypass"]):
                        findings.append(
                            SecurityFinding(
                                category="PROMPT_INJECTION",
                                severity="HIGH",
                                description=f"HTML comment contains prompt injection payload: '{comment_str[:60]}...'",
                            )
                        )

            # Check credential harvesting forms
            forms = soup.find_all("form")
            for form in forms:
                pwd_inputs = form.find_all("input", attrs={"type": re.compile(r"password", re.I)})
                if pwd_inputs:
                    action = form.get("action", "")
                    findings.append(
                        SecurityFinding(
                            category="PHISHING",
                            severity="HIGH",
                            description=f"[BS4] Form with password input detected (action: '{action}').",
                        )
                    )
        except Exception:
            pass

        return findings

    def _fallback_html_check(self, content: str) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []
        if re.search(r"style=[\"'].*?(display:\s*none|visibility:\s*hidden|font-size:\s*0|opacity:\s*0).*?[\"']", content, re.I):
            findings.append(
                SecurityFinding(
                    category="HIDDEN_CONTENT",
                    severity="MEDIUM",
                    description="Hidden HTML styling attribute detected.",
                )
            )
        return findings

    def _analyze_url_structure(self, url: str) -> List[SecurityFinding]:
        findings: List[SecurityFinding] = []

        # Check IP-address URL
        if re.search(self.IP_URL_REGEX, url):
            findings.append(
                SecurityFinding(
                    category="URL_SECURITY",
                    severity="HIGH",
                    description=f"Raw IP address used in URL instead of hostname: {url}",
                )
            )

        # tldextract domain decomposition
        domain_name = ""
        if TLD_AVAILABLE:
            try:
                ext = tldextract.extract(url)
                suffix = ext.suffix.lower()
                subdomain = ext.subdomain.lower()
                domain_name = getattr(ext, "top_domain_under_public_suffix", getattr(ext, "registered_domain", ""))

                # Check suspicious TLD
                if suffix in self.SUSPICIOUS_TLDS:
                    findings.append(
                        SecurityFinding(
                            category="URL_SECURITY",
                            severity="MEDIUM",
                            description=f"URL uses suspicious TLD (.{suffix}): {url}",
                        )
                    )

                # Check deep/unusual subdomains
                if subdomain and subdomain.count(".") >= 2:
                    findings.append(
                        SecurityFinding(
                            category="URL_SECURITY",
                            severity="MEDIUM",
                            description=f"URL contains suspicious multi-level subdomain hierarchy: {subdomain}",
                        )
                    )

                if any(kw in subdomain for kw in ["login", "verify", "secure", "account", "update", "bank"]):
                    findings.append(
                        SecurityFinding(
                            category="URL_SECURITY",
                            severity="HIGH",
                            description=f"Subdomain contains suspicious phishing keyword: {subdomain}",
                        )
                    )
            except Exception:
                pass

        # Local DNS analysis if domain extracted and DNS enabled
        if self.perform_dns and DNS_AVAILABLE and domain_name:
            try:
                resolver = dns.resolver.Resolver()
                resolver.timeout = 0.5
                resolver.lifetime = 0.5
                answers = resolver.resolve(domain_name, "A")
                ips = [str(rdata) for rdata in answers]
                if ips:
                    findings.append(
                        SecurityFinding(
                            category="DNS_ANALYSIS",
                            severity="LOW",
                            description=f"[dnspython] Local DNS resolved {domain_name} -> {', '.join(ips[:2])}",
                        )
                    )
            except Exception:
                # DNS failure or timeout - do NOT flag as malicious, just skip
                pass

        return findings
