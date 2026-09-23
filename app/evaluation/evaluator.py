"""Batch Evaluation Engine for TraceGuard AI."""

from typing import List, Optional
from app.evaluation.attack_runner import get_attack_runner
from app.evaluation.evaluation_models import FullEvaluationReport, ScenarioEvaluationResult
from app.evaluation.metrics import calculate_metrics
from app.evaluation.scenario_models import EvaluationScenario, list_all_scenarios


class BatchEvaluator:
    """Orchestrates comprehensive benchmark evaluations across all scenarios."""

    def __init__(self):
        self.runner = get_attack_runner()

    def run_full_evaluation(
        self,
        scenarios: Optional[List[EvaluationScenario]] = None,
    ) -> FullEvaluationReport:
        """
        Execute full security evaluation across synthetic benchmark scenarios.
        Uses the genuine TraceGuard pipeline to measure defense efficacy and latency.
        """
        if scenarios is None:
            scenarios = list_all_scenarios()

        results: List[ScenarioEvaluationResult] = []
        for scenario in scenarios:
            res = self.runner.run_scenario(scenario)
            results.append(res)

        metrics = calculate_metrics(scenarios=scenarios, results=results)
        failed_scenarios = [r for r in results if not r.passed]

        limitations = [
            "Benchmark dataset consists of 10 deterministic synthetic scenarios (N=10).",
            "Obfuscated / encoded payloads (e.g., Base64) are not automatically decoded by the heuristic text detector.",
            "Defense against encoded attacks relies on downstream Business Verification & Action Firewall intent enforcement.",
            "Performance latency metrics measured in local development execution environment.",
            "Mock tools simulated with zero external network or banking side effects.",
        ]

        return FullEvaluationReport(
            metrics=metrics,
            scenario_results=results,
            failed_scenarios=failed_scenarios,
            limitations_noted=limitations,
        )


# Global evaluator singleton
_evaluator = BatchEvaluator()


def get_batch_evaluator() -> BatchEvaluator:
    """Return global singleton batch evaluator."""
    return _evaluator
