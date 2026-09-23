def make_policy_decision(risk_result: dict) -> dict:

    risk_level = risk_result["risk_level"]

    if risk_level == "HIGH":
        return {
            "decision": "BLOCK",
            "reason": "High-risk request blocked by security policy.",
            "requires_user_confirmation": False
        }

    if risk_level == "MEDIUM":
        return {
            "decision": "CONFIRM",
            "reason": "Medium-risk request requires user confirmation.",
            "requires_user_confirmation": True
        }

    return {
        "decision": "ALLOW",
        "reason": "Low-risk request allowed by security policy.",
        "requires_user_confirmation": False
    }