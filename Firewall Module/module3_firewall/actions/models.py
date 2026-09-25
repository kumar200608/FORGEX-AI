from enum import Enum
from pydantic import BaseModel


class ActionSensitivityLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ActionSensitivity(BaseModel):
    """Represents the security sensitivity classification of a tool action."""

    action: str
    sensitivity: ActionSensitivityLevel
    reason: str
