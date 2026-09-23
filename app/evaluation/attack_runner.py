"""Scenario Execution and Verification Runner for TraceGuard AI."""

import time
from typing import List
from app.agent.intent_contract import create_intent_contract
from app.agent.planner import get_planner
from app.business.vendor_verification import get_vendor_verification_engine
from app.core.models import (
    FirewallEvaluation,
    PipelineRunResult,
    PolicyDecision,
    ToolExecutionResult,
)
from app.evaluation.evaluation_models import ScenarioEvaluationResult
from app.evaluation.scenario_models import EvaluationScenario
from app.ingestion.invoice_parser import parse_invoice_bytes
from app.provenance.evidence_graph import EvidenceGraphBuilder
from app.provenance.source_registry import get_source_registry
from app.provenance.taint_tracker import get_taint_tracker
from app.recovery.recovery_engine import get_recovery_engine
from app.security.action_firewall import get_action_firewall
from app.security.explanation_engine import get_explanation_engine
from app.security.injection_detector import detect_prompt_injection
from app.tools.mock_tools import MockTools


class ScenarioAttackRunner:
    """Executes evaluation scenarios against the genuine TraceGuard pipeline."""

    def __init__(self):
        self.source_registry = get_source_registry()
        self.taint_tracker = get_taint_tracker()
        self.action_firewall = get_action_firewall()
        self.planner = get_planner()
        self.vendor_verification = get_vendor_verification_engine()
        self.explanation_engine = get_explanation_engine()
        self.recovery_engine = get_recovery_engine()

    def run_scenario(self, scenario: EvaluationScenario) -> ScenarioEvaluationResult:
        """
        Execute an evaluation scenario through the complete TraceGuard runtime security pipeline.
        Measure decision latency and compare observed behavior with expected criteria.
        """
        start_time = time.perf_counter()

        # 1. Ingest & Hash
        content_bytes = scenario.invoice_text.encode("utf-8")
        source = parse_invoice_bytes(
            filename=f"{scenario.scenario_id.lower()}.txt",
            content=content_bytes,
            save_to_upload_dir=False,
        )
        self.source_registry.register_source(source)

        # 2. Injection Analysis & Taint Evaluation
        detection = detect_prompt_injection(source.raw_text)
        updated_taint = self.taint_tracker.evaluate_source_taint(source, detection)
        source = source.model_copy(update={"taint_status": updated_taint})
        self.source_registry.update_taint_status(source.source_id, updated_taint)

        # 3. Business Context Verification
        bv = self.vendor_verification.verify_invoice_business_context(
            source_id=source.source_id,
            extracted_fields=source.extracted_fields,
        )

        # 4. Create User Intent Contract
        intent = create_intent_contract(user_goal=scenario.user_goal)

        # 5. Agent Planning
        plan = self.planner.generate_plan(intent=intent, source=source, injection_result=detection)

        # 6. Action Firewall Gating
        evaluations: List[FirewallEvaluation] = []
        tool_results: List[ToolExecutionResult] = []
        has_blocked = False

        for step in plan.steps:
            eval_result = self.action_firewall.evaluate_step(
                step=step,
                intent=intent,
                source_id=source.source_id,
                source_taint_status=updated_taint,
                business_verification=bv,
            )
            evaluations.append(eval_result)

            # 7. Mock Tool Execution
            tool_res = MockTools.execute_tool(
                tool_name=step.action_name,
                arguments=step.arguments,
                firewall_evaluation=eval_result,
            )
            tool_results.append(tool_res)

            if eval_result.decision == PolicyDecision.BLOCK:
                has_blocked = True

        overall_decision = PolicyDecision.BLOCK if has_blocked else (
            PolicyDecision.ASK_USER if any(e.decision == PolicyDecision.ASK_USER for e in evaluations) else PolicyDecision.ALLOW
        )

        # 8. Recovery & Explanation
        recovery = self.recovery_engine.determine_recovery_action(
            overall_decision=overall_decision,
            evaluations=evaluations,
            business_verification=bv,
        )
        explanation = self.explanation_engine.generate_explanation(
            overall_decision=overall_decision,
            intent=intent,
            source=source,
            injection_result=detection,
            evaluations=evaluations,
            business_verification=bv,
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Verification & Assertions
        failure_reasons: List[str] = []
        actual_blocked_actions = [
            e.action_name for e in evaluations if e.decision == PolicyDecision.BLOCK
        ]

        # Check Decision
        if overall_decision != scenario.expected_decision:
            failure_reasons.append(
                f"Decision mismatch: Expected '{scenario.expected_decision.value}', got '{overall_decision.value}'"
            )

        # Check Injection Detection
        if detection.detected != scenario.expected_injection:
            failure_reasons.append(
                f"Injection detection mismatch: Expected '{scenario.expected_injection}', got '{detection.detected}'"
            )

        # Check Taint
        if updated_taint != scenario.expected_taint:
            failure_reasons.append(
                f"Taint mismatch: Expected '{scenario.expected_taint.value}', got '{updated_taint.value}'"
            )

        # Check Expected Blocked Actions
        for expected_blocked in scenario.expected_blocked_actions:
            if expected_blocked not in actual_blocked_actions:
                failure_reasons.append(
                    f"Action '{expected_blocked}' was expected to be BLOCKED, but was not blocked."
                )

        passed = len(failure_reasons) == 0

        return ScenarioEvaluationResult(
            scenario_id=scenario.scenario_id,
            name=scenario.name,
            category=scenario.category,
            is_malicious=scenario.is_malicious,
            expected_decision=scenario.expected_decision,
            actual_decision=overall_decision,
            expected_injection=scenario.expected_injection,
            actual_injection=detection.detected,
            expected_taint=scenario.expected_taint,
            actual_taint=updated_taint,
            expected_blocked_actions=scenario.expected_blocked_actions,
            actual_blocked_actions=actual_blocked_actions,
            passed=passed,
            latency_ms=round(elapsed_ms, 3),
            failure_reasons=failure_reasons,
            explanation=explanation,
            recovery_action=recovery.action_type,
        )


# Global singleton
_attack_runner = ScenarioAttackRunner()


def get_attack_runner() -> ScenarioAttackRunner:
    """Return global singleton scenario attack runner."""
    return _attack_runner
