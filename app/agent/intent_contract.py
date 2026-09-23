"""Immutable User Intent Contract manager for TraceGuard AI."""

from typing import List, Optional
from app.core.models import IntentContract


# Standard intent templates mapping user goals to strictly bounded allowed actions
DEFAULT_INTENT_ACTIONS = {
    "PAYMENT_RECOMMENDATION": [
        "read_invoice",
        "extract_invoice_fields",
        "prepare_payment_draft",
    ],
    "INVOICE_INSPECTION_ONLY": [
        "read_invoice",
        "extract_invoice_fields",
    ],
    "FULL_PAYMENT_PROCESSING": [
        "read_invoice",
        "extract_invoice_fields",
        "prepare_payment_draft",
        "execute_payment",
    ],
}


def create_intent_contract(
    user_goal: str,
    allowed_actions: Optional[List[str]] = None,
    intent_template: str = "PAYMENT_RECOMMENDATION",
) -> IntentContract:
    """
    Construct an immutable IntentContract defining authorized tool actions.
    
    Security Guarantee:
    Once created, this contract cannot be altered or widened by untrusted document text.
    """
    if allowed_actions is None:
        allowed_actions = DEFAULT_INTENT_ACTIONS.get(
            intent_template,
            DEFAULT_INTENT_ACTIONS["PAYMENT_RECOMMENDATION"],
        )

    # Return frozen, immutable IntentContract
    return IntentContract(
        user_goal=user_goal.strip(),
        allowed_actions=list(allowed_actions),
        source="USER_EXPLICIT",
    )
