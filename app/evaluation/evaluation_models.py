"""Structured Evaluation Result and Metrics Models for TraceGuard AI."""

from datetime import datetime, timezone
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field
from app.core.models import PolicyDecision, TaintStatus


class ScenarioEvaluationResult(BaseModel):
    """Structured result of executing a single benchmark scenario through TraceGuard."""
    evaluation_id: str = Field(
        default_factory=lambda: f"EVR-{uuid.uuid4().hex[:8].upper()}",
        description="Unique evaluation result ID",
    )
    scenario_id: str = Field(..., description="Scenario identifier")
    name: str = Field(..., description="Scenario name")
    category: str = Field(..., description="Scenario category")
    is_malicious: bool = Field(..., description="Whether scenario was malicious / policy-violating")
    expected_decision: PolicyDecision = Field(..., description="Expected overall decision")
    actual_decision: PolicyDecision = Field(..., description="Observed firewall decision")
    expected_injection: bool = Field(..., description="Expected injection detection")
    actual_injection: bool = Field(..., description="Observed injection detection")
    expected_taint: TaintStatus = Field(..., description="Expected taint status")
    actual_taint: TaintStatus = Field(..., description="Observed taint status")
    expected_blocked_actions: List[str] = Field(default_factory=list, description="Expected blocked actions")
    actual_blocked_actions: List[str] = Field(default_factory=list, description="Observed blocked actions")
    passed: bool = Field(..., description="True if observed outcome matches expected criteria")
    latency_ms: float = Field(..., description="Execution latency in milliseconds")
    failure_reasons: List[str] = Field(default_factory=list, description="Reasons if scenario test failed")
    explanation: Optional[str] = Field(default=None, description="Generated security rationale")
    recovery_action: Optional[str] = Field(default=None, description="Suggested recovery action type")


class EvaluationMetrics(BaseModel):
    """Calculated security and performance metrics from benchmark execution."""
    total_scenarios: int = Field(..., description="Total executed scenarios")
    passed_scenarios: int = Field(..., description="Scenarios matching expected behavior")
    failed_scenarios: int = Field(..., description="Scenarios failing expected criteria")
    malicious_scenarios_count: int = Field(..., description="Count of attack/malicious scenarios")
    benign_scenarios_count: int = Field(..., description="Count of clean/benign scenarios")
    attack_success_count: int = Field(
        ...,
        description="Count of malicious scenarios where unauthorized action succeeded (Security Breach)",
    )
    attack_success_rate: float = Field(
        ...,
        description="Percentage of attacks that successfully bypassed security (Lower is better, target 0.0%)",
    )
    blocked_malicious_count: int = Field(
        ...,
        description="Count of malicious/tampered scenarios correctly BLOCKED or GATED",
    )
    block_rate: float = Field(
        ...,
        description="Percentage of malicious scenarios correctly blocked (Higher is better, target 100.0%)",
    )
    false_positive_count: int = Field(
        ...,
        description="Count of benign scenarios incorrectly BLOCKED",
    )
    false_positive_rate: float = Field(
        ...,
        description="Percentage of benign scenarios incorrectly blocked (Lower is better, target 0.0%)",
    )
    intent_violation_total: int = Field(
        ...,
        description="Total scenarios containing unauthorized intent violations",
    )
    intent_violation_caught: int = Field(
        ...,
        description="Count of intent violations caught and blocked by Action Firewall",
    )
    intent_violation_catch_rate: float = Field(
        ...,
        description="Percentage of intent violations blocked by firewall (Target 100.0%)",
    )
    avg_latency_ms: float = Field(..., description="Average pipeline decision time in ms")
    min_latency_ms: float = Field(..., description="Minimum pipeline decision time in ms")
    max_latency_ms: float = Field(..., description="Maximum pipeline decision time in ms")
    sample_size_note: str = Field(
        default="Benchmark metrics calculated on synthetic evaluation dataset (N=10).",
        description="Sample size disclosure",
    )


class FullEvaluationReport(BaseModel):
    """Complete evaluation report containing metrics, individual scenario results, and disclosures."""
    report_id: str = Field(
        default_factory=lambda: f"REP-{uuid.uuid4().hex[:8].upper()}",
        description="Unique report ID",
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Report generation timestamp in UTC",
    )
    metrics: EvaluationMetrics = Field(..., description="Calculated aggregate metrics")
    scenario_results: List[ScenarioEvaluationResult] = Field(
        default_factory=list,
        description="Individual scenario execution outputs",
    )
    failed_scenarios: List[ScenarioEvaluationResult] = Field(
        default_factory=list,
        description="List of failed scenario runs (if any)",
    )
    limitations_noted: List[str] = Field(
        default_factory=list,
        description="Honest engineering limitations disclosed during evaluation",
    )
