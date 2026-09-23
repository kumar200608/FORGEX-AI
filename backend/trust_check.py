TRUSTED_SOURCES = {
    "user",
    "system"
}

UNTRUSTED_SOURCES = {
    "email",
    "web",
    "pdf",
    "external_tool"
}


def check_source(source: str) -> dict:
    source = source.lower().strip()

    if source in TRUSTED_SOURCES:
        return {
            "source": source,
            "trust_level": "TRUSTED",
            "reason": "Source is a trusted instruction source."
        }

    if source in UNTRUSTED_SOURCES:
        return {
            "source": source,
            "trust_level": "UNTRUSTED",
            "reason": "Content comes from an external or untrusted source."
        }

    return {
        "source": source,
        "trust_level": "UNKNOWN",
        "reason": "Source is not recognized."
    }