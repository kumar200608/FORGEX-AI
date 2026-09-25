from abc import ABC, abstractmethod
from typing import List
from module3_firewall.models.security import SecurityInput, SecurityFinding


class BaseAnalyzer(ABC):
    """Common interface for source-specific security analyzers."""

    @abstractmethod
    def analyze(self, security_input: SecurityInput) -> List[SecurityFinding]:
        """Analyze security input and return a list of security findings."""
        pass
