import base64
import re
import unicodedata
import urllib.parse
from typing import List, Set, Tuple
from app.core.models import InjectionDetectionResult

# Injection pattern rules with associated risk tiers
INJECTION_RULES: List[Tuple[str, str, str]] = [
    (
        r"ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions",
        "CRITICAL",
        "Direct instruction override attempt ('ignore previous instructions')",
    ),
    (
        r"(?:system|developer|admin)\s+(?:message|override|prompt|directive|instruction|mode)",
        "HIGH",
        "System or developer prompt boundary spoofing attempt",
    ),
    (
        r"(?:override|disable|bypass)\s+(?:all\s+)?(?:security|safety|instructions|policy|rules|checks|guardrails|filters)",
        "CRITICAL",
        "Security policy override or disable directive",
    ),
    (
        r"(?:change|replace|update|switch|modify)\s+(?:the\s+)?(?:approved\s+)?(?:beneficiary|bank\s*account|iban|payee|recipient)",
        "HIGH",
        "Unauthorized financial beneficiary modification instruction",
    ),
    (
        r"(?:send|forward|exfiltrate|leak|transmit|export)\s+(?:the\s+)?(?:[a-zA-Z0-9_\-]+\s+){0,6}(?:to|externally\s+to|externally)\s+[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+",
        "HIGH",
        "Unauthorized external data exfiltration via email",
    ),
    (
        r"(?:send|forward|exfiltrate|leak|transmit|export)\s+(?:confidential|sensitive|secret|private|invoice)?\s*(?:data|details|information|database)?\s*(?:externally|outside|to\s+external|to\s+[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+)",
        "HIGH",
        "External data exfiltration command",
    ),
    (
        r"(?:reveal|disclose|show|leak|print)\s+(?:secrets|credentials|passwords|keys|api\s*keys)",
        "HIGH",
        "Credential disclosure attempt",
    ),
    (
        r"bypass\s+(?:security|firewall|guardrails|filters|checks)",
        "CRITICAL",
        "Explicit security bypass instruction",
    ),
    (
        r"transfer\s+(?:all\s+)?(?:funds|money|amount|balance)\s+to\s+",
        "HIGH",
        "Direct money transfer instruction in document text",
    ),
    (
        r"(?:execute|run)\s+(?:shell|command|bash|powershell|script|eval|exec|sql)",
        "CRITICAL",
        "Arbitrary code or command execution directive",
    ),
]

# Common Cyrillic and Greek homoglyph mappings to Latin ASCII
HOMOGLYPH_MAP = {
    '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p',
    '\u0441': 'c', '\u0443': 'y', '\u0445': 'x', '\u0456': 'i',
    '\u0458': 'j', '\u0410': 'A', '\u0415': 'E', '\u041e': 'O',
    '\u0420': 'P', '\u0421': 'C', '\u0422': 'T', '\u0425': 'X',
    '\u03b1': 'a', '\u03b5': 'e', '\u03bf': 'o', '\u03c1': 'p',
    '\u200b': '', '\u200c': '', '\u200d': '', '\ufeff': '',
}


def _normalize_homoglyphs(text: str) -> str:
    """Safely map common homoglyphs and remove zero-width characters."""
    normalized = unicodedata.normalize("NFKD", text)
    result = []
    for char in normalized:
        result.append(HOMOGLYPH_MAP.get(char, char))
    return "".join(result)


def _scan_text_for_rules(text: str) -> List[Tuple[str, str, str]]:
    """Scan text against deterministic rules and return list of (pattern, risk_level, description)."""
    matches = []
    normalized_text = " ".join(text.lower().split())
    for pattern, risk_level, description in INJECTION_RULES:
        match = re.search(pattern, normalized_text, re.IGNORECASE)
        if match:
            matches.append((match.group(0), risk_level, description))
    return matches


def _extract_and_scan_encoded(text: str) -> List[Tuple[str, str, str]]:
    """
    Safely extract and decode candidate Base64 and URL-encoded strings with size limits.
    Returns matched injection patterns from decoded representations.
    """
    decoded_matches = []

    # 1. URL-encoded scan (up to 2 levels of unquoting)
    if "%" in text:
        try:
            url_decoded = urllib.parse.unquote(text)
            if "%" in url_decoded:
                url_decoded = urllib.parse.unquote(url_decoded)
            if url_decoded != text:
                url_matches = _scan_text_for_rules(url_decoded)
                for pat, r_lvl, desc in url_matches:
                    decoded_matches.append((pat, r_lvl, f"[URL_DECODED] {desc}"))
        except Exception:
            pass

    # 2. Base64 token candidate extraction (tokens between 16 and 1024 chars)
    base64_candidates = re.findall(r"(?:[A-Za-z0-9+/]{4}){4,256}={0,2}", text)
    seen_decoded: Set[str] = set()

    for cand in base64_candidates:
        if len(cand) < 16 or cand in seen_decoded:
            continue
        seen_decoded.add(cand)
        try:
            raw_bytes = base64.b64decode(cand, validate=True)
            if len(raw_bytes) > 2048:
                continue
            decoded_str = raw_bytes.decode("utf-8", errors="ignore").strip()
            if decoded_str and len(decoded_str) >= 8:
                b64_matches = _scan_text_for_rules(decoded_str)
                for pat, r_lvl, desc in b64_matches:
                    decoded_matches.append((pat, r_lvl, f"[BASE64_DECODED] {desc} in '{cand[:16]}...'"))
        except Exception:
            continue

    return decoded_matches


def detect_prompt_injection(text: str) -> InjectionDetectionResult:
    """
    Scan untrusted document text for deterministic prompt-injection patterns,
    including direct patterns, homoglyph substitutions, URL encoding, and Base64 payloads.
    
    NOTE: Deterministic security heuristic. Guaranteed fail-safe policy enforcement
    is finalized downstream at the Action Firewall boundary.
    """
    if not text or not text.strip():
        return InjectionDetectionResult(
            detected=False,
            risk_level="NONE",
            matched_patterns=[],
            reason="Empty content analyzed; no patterns detected.",
        )

    matched_patterns: List[str] = []
    matched_reasons: List[str] = []
    highest_risk = "NONE"
    risk_rank = {"NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

    # Pass 1: Direct rule matching
    direct_matches = _scan_text_for_rules(text)
    for pat, r_lvl, desc in direct_matches:
        matched_patterns.append(pat)
        matched_reasons.append(f"[{r_lvl}] {desc} ('{pat}')")
        if risk_rank.get(r_lvl, 0) > risk_rank.get(highest_risk, 0):
            highest_risk = r_lvl

    # Pass 2: Homoglyph-normalized matching
    homoglyph_text = _normalize_homoglyphs(text)
    if homoglyph_text != text:
        homoglyph_matches = _scan_text_for_rules(homoglyph_text)
        for pat, r_lvl, desc in homoglyph_matches:
            if pat not in matched_patterns:
                matched_patterns.append(pat)
                matched_reasons.append(f"[{r_lvl}] [HOMOGLYPH_NORMALIZED] {desc} ('{pat}')")
                if risk_rank.get(r_lvl, 0) > risk_rank.get(highest_risk, 0):
                    highest_risk = r_lvl

    # Pass 3: Obfuscated / Encoded scanning (URL + Base64)
    encoded_matches = _extract_and_scan_encoded(text)
    for pat, r_lvl, desc in encoded_matches:
        if pat not in matched_patterns:
            matched_patterns.append(pat)
            matched_reasons.append(f"[{r_lvl}] {desc}")
            if risk_rank.get(r_lvl, 0) > risk_rank.get(highest_risk, 0):
                highest_risk = r_lvl

    if matched_patterns:
        return InjectionDetectionResult(
            detected=True,
            risk_level=highest_risk,
            matched_patterns=matched_patterns,
            reason=f"Detected {len(matched_patterns)} injection indicator(s): " + "; ".join(matched_reasons),
        )

    return InjectionDetectionResult(
        detected=False,
        risk_level="NONE",
        matched_patterns=[],
        reason="No prompt-injection signatures identified by deterministic heuristic rules.",
    )
