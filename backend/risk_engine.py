def calculate_risk(trust_result: dict, taint_result: dict, injection_result: dict) -> dict:

    risk_score = 0
    reasons = []

    # Untrusted source
    if trust_result["trust_level"] == "UNTRUSTED":
        risk_score += 30
        reasons.append("Content comes from an untrusted source.")

    # Tainted action
    if taint_result["tainted"]:
        risk_score += 30
        reasons.append("Sensitive action is influenced by untrusted content.")

    # Prompt injection
    if injection_result["injection_detected"]:
        risk_score += 40
        reasons.append("Possible indirect prompt injection detected.")

    # Risk level
    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons
    }