from fastapi import FastAPI
from pydantic import BaseModel
import uuid
import json
import os

from trust_check import check_source
from taint_tracker import check_taint
from injection_detector import detect_injection
from risk_engine import calculate_risk
from policy_engine import make_policy_decision
from email_tool import send_email
from audit_log import create_audit_log


app = FastAPI(
    title="TrustGuard",
    description="Indirect Prompt Injection Security Layer",
    version="1.0.0"
)


# Store pending confirmation requests
pending_confirmations = {}


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "TrustGuard",
        "message": "TrustGuard Security Layer is running"
    }


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ==================================================
# AUDIT LOGS
# ==================================================

@app.get("/audit-logs")
def get_audit_logs():

    log_file = "audit_logs.json"

    if not os.path.exists(log_file):
        return {
            "status": "success",
            "logs": []
        }

    try:
        with open(log_file, "r", encoding="utf-8") as file:
            logs = json.load(file)

        return {
            "status": "success",
            "logs": logs
        }

    except (json.JSONDecodeError, OSError):
        return {
            "status": "error",
            "message": "Unable to read audit logs."
        }


# ==================================================
# SECURITY REQUEST MODEL
# ==================================================

class SecurityRequest(BaseModel):
    action: str
    recipient: str
    subject: str
    body: str
    source: str
    source_content: str
    user_instruction: str


# ==================================================
# SECURITY CHECK
# ==================================================

@app.post("/security/check")
def security_check(request: SecurityRequest):

    # 1. Check source trust
    trust_result = check_source(
        request.source
    )

    # 2. Check taint
    taint_result = check_taint(
        request.source,
        request.source_content,
        request.action
    )

    # 3. Detect prompt injection
    injection_result = detect_injection(
        request.source_content
    )

    # 4. Calculate risk
    risk_result = calculate_risk(
        trust_result,
        taint_result,
        injection_result
    )

    # 5. Make policy decision
    policy_result = make_policy_decision(
        risk_result
    )

    # 6. Create audit log
    audit_result = create_audit_log(
        request.action,
        request.source,
        risk_result,
        policy_result
    )

    email_result = None
    request_id = None


    # ==================================================
    # ALLOW
    # ==================================================

    if policy_result["decision"] == "ALLOW":

        email_result = send_email(
            request.recipient,
            request.subject,
            request.body
        )


    # ==================================================
    # CONFIRM
    # ==================================================

    elif policy_result["decision"] == "CONFIRM":

        request_id = str(uuid.uuid4())

        pending_confirmations[request_id] = {
            "recipient": request.recipient,
            "subject": request.subject,
            "body": request.body
        }


    # ==================================================
    # BLOCK
    # ==================================================

    elif policy_result["decision"] == "BLOCK":

        email_result = None


    # ==================================================
    # SECURITY CHECK RESPONSE
    # ==================================================

    return {
        "status": "security_checked",
        "action": request.action,
        "source": request.source,
        "trust": trust_result,
        "taint": taint_result,
        "injection": injection_result,
        "risk": risk_result,
        "policy": policy_result,
        "audit": audit_result,
        "request_id": request_id,
        "email": email_result
    }


# ==================================================
# CONFIRM SECURITY REQUEST
# ==================================================

@app.post("/security/confirm/{request_id}")
def confirm_security_request(
    request_id: str,
    approved: bool
):

    request_data = pending_confirmations.get(
        request_id
    )


    # Request not found
    if not request_data:

        return {
            "status": "error",
            "message": "Confirmation request not found or expired."
        }


    # ==================================================
    # USER REJECTED
    # ==================================================

    if not approved:

        del pending_confirmations[request_id]

        return {
            "status": "blocked",
            "message": "User rejected the request. Email was not sent."
        }


    # ==================================================
    # USER APPROVED
    # ==================================================

    email_result = send_email(
        request_data["recipient"],
        request_data["subject"],
        request_data["body"]
    )


    # Remove request after execution
    del pending_confirmations[request_id]


    return {
        "status": "approved",
        "message": "User approved the request. Email tool executed.",
        "email": email_result
    }