INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all previous instructions",
    "disregard previous instructions",
    "override your instructions",
    "do not tell the user",
    "send confidential data",
    "send company data",
    "reveal confidential information"
]


def detect_injection(content: str) -> dict:
    content_lower = content.lower()

    detected_patterns = [
        pattern
        for pattern in INJECTION_PATTERNS
        if pattern in content_lower
    ]

    if detected_patterns:
        return {
            "injection_detected": True,
            "confidence": 0.95,
            "reasons": detected_patterns
        }

    return {
        "injection_detected": False,
        "confidence": 0.05,
        "reasons": []
    }