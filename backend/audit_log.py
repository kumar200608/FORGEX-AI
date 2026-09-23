import json
import os
from datetime import datetime

LOG_FILE = "audit_logs.json"


def create_audit_log(
    action: str,
    source: str,
    risk: dict,
    policy: dict
) -> dict:

    audit_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "source": source,
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "decision": policy["decision"]
    }

    logs = []

    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as file:
                logs = json.load(file)

            if not isinstance(logs, list):
                logs = []

        except (json.JSONDecodeError, OSError):
            logs = []

    logs.append(audit_entry)

    with open(LOG_FILE, "w", encoding="utf-8") as file:
        json.dump(logs, file, indent=2, ensure_ascii=False)

    return audit_entry