def check_taint(source: str, source_content: str, action: str) -> dict:

    if source.lower().strip() in {"email", "web", "pdf", "external_tool"}:
        return {
            "tainted": True,
            "taint_source": source,
            "action": action,
            "reason": "Sensitive action is influenced by untrusted external content."
        }

    return {
        "tainted": False,
        "taint_source": None,
        "action": action,
        "reason": "No untrusted source influence detected."
    }