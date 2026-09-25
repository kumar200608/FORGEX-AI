from typing import Dict
from module3_firewall.actions.models import ActionSensitivity, ActionSensitivityLevel


class ActionAnalyzer:
    """Classifies tool actions into HIGH, MEDIUM, or LOW risk sensitivity categories."""

    SENSITIVITY_MAP: Dict[str, ActionSensitivity] = {
        # HIGH Risk Actions
        "send_email": ActionSensitivity(
            action="send_email",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="External communication can exfiltrate sensitive data or trigger unauthorized messages.",
        ),
        "send_mail": ActionSensitivity(
            action="send_mail",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="External email dispatch can exfiltrate data.",
        ),
        "make_payment": ActionSensitivity(
            action="make_payment",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="Financial transaction action carries severe risk.",
        ),
        "transfer_money": ActionSensitivity(
            action="transfer_money",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="Financial transfer action carries severe risk.",
        ),
        "execute_command": ActionSensitivity(
            action="execute_command",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="Arbitrary code/shell execution can compromise system integrity.",
        ),
        "delete_file": ActionSensitivity(
            action="delete_file",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="File deletion causes permanent data loss.",
        ),
        "upload_sensitive_file": ActionSensitivity(
            action="upload_sensitive_file",
            sensitivity=ActionSensitivityLevel.HIGH,
            reason="Uploading files externally risks sensitive data exposure.",
        ),

        # MEDIUM Risk Actions
        "modify_file": ActionSensitivity(
            action="modify_file",
            sensitivity=ActionSensitivityLevel.MEDIUM,
            reason="File modification alters system or document state.",
        ),
        "browser_action": ActionSensitivity(
            action="browser_action",
            sensitivity=ActionSensitivityLevel.MEDIUM,
            reason="Interactive web browsing can navigate to untrusted domains.",
        ),
        "access_sensitive_data": ActionSensitivity(
            action="access_sensitive_data",
            sensitivity=ActionSensitivityLevel.MEDIUM,
            reason="Reading internal restricted databases or files.",
        ),

        # LOW Risk Actions
        "read_public_information": ActionSensitivity(
            action="read_public_information",
            sensitivity=ActionSensitivityLevel.LOW,
            reason="Reading public non-sensitive data.",
        ),
        "search": ActionSensitivity(
            action="search",
            sensitivity=ActionSensitivityLevel.LOW,
            reason="Read-only query search action.",
        ),
        "get_weather": ActionSensitivity(
            action="get_weather",
            sensitivity=ActionSensitivityLevel.LOW,
            reason="Public weather data query.",
        ),
        "read_public_page": ActionSensitivity(
            action="read_public_page",
            sensitivity=ActionSensitivityLevel.LOW,
            reason="Reading public static web documentation.",
        ),
    }

    def analyze_action(self, action_name: str) -> ActionSensitivity:
        """Return sensitivity classification for a given action string."""
        normalized = action_name.lower().strip()
        if normalized in self.SENSITIVITY_MAP:
            return self.SENSITIVITY_MAP[normalized]

        # Safe fallback default for unknown actions
        return ActionSensitivity(
            action=action_name,
            sensitivity=ActionSensitivityLevel.MEDIUM,
            reason="Unrecognized action assigned default MEDIUM risk sensitivity.",
        )
