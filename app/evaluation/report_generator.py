"""Evaluation Report Generator for TraceGuard AI."""

import json
from pathlib import Path
from typing import Optional
from app.core.config import get_settings
from app.evaluation.evaluation_models import FullEvaluationReport

settings = get_settings()


class EvaluationReportGenerator:
    """Exports structured JSON and human-readable Markdown evaluation reports."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def save_json_report(self, report: FullEvaluationReport, filename: str = "evaluation_report.json") -> Path:
        """Write evaluation report to disk as formatted JSON."""
        dest = self.output_dir / filename
        dest.write_text(report.model_dump_json(indent=2), encoding="utf-8")
        return dest

    def save_markdown_report(self, report: FullEvaluationReport, filename: str = "evaluation_report.md") -> Path:
        """Generate human-readable Markdown summary report."""
        dest = self.output_dir / filename
        m = report.metrics

        lines = [
            "# TRACEGUARD AI — SECURITY EVALUATION REPORT",
            f"**Report ID**: `{report.report_id}`  ",
            f"**Timestamp**: `{report.timestamp.isoformat()}`  ",
            f"**Sample Size**: {m.total_scenarios} Scenarios ({m.malicious_scenarios_count} Malicious, {m.benign_scenarios_count} Benign)  ",
            "",
            "---",
            "",
            "## 📊 Aggregate Security Metrics",
            "",
            "| Metric | Value | Status | Target |",
            "|---|---|---|---|",
            f"| **Attack Success Rate** | `{m.attack_success_rate}%` | {'✅ Optimal' if m.attack_success_rate == 0.0 else '⚠️ Elevated'} | 0.0% |",
            f"| **Malicious Scenario Block Rate** | `{m.block_rate}%` | {'✅ 100%' if m.block_rate == 100.0 else '⚠️ Partial'} | 100.0% |",
            f"| **False Positive Rate** | `{m.false_positive_rate}%` | {'✅ 0%' if m.false_positive_rate == 0.0 else '⚠️ Warning'} | 0.0% |",
            f"| **Intent-Violation Catch Rate** | `{m.intent_violation_catch_rate}%` | {'✅ 100%' if m.intent_violation_catch_rate == 100.0 else '⚠️ Warning'} | 100.0% |",
            f"| **Passed Benchmark Scenarios** | `{m.passed_scenarios}/{m.total_scenarios}` | {'✅ All Passed' if m.failed_scenarios == 0 else '❌ Failures Detected'} | {m.total_scenarios}/{m.total_scenarios} |",
            f"| **Average Decision Latency** | `{m.avg_latency_ms} ms` | Measured | < 100 ms |",
            "",
            "---",
            "",
            "## 🧪 Detailed Scenario Execution Matrix",
            "",
            "| Scenario ID | Name | Category | Expected | Actual | Latency | Status |",
            "|---|---|---|---|---|---|---|",
        ]

        for r in report.scenario_results:
            status_icon = "✅ PASS" if r.passed else "❌ FAIL"
            lines.append(
                f"| `{r.scenario_id}` | {r.name} | `{r.category}` | `{r.expected_decision.value}` | `{r.actual_decision.value}` | `{r.latency_ms} ms` | {status_icon} |"
            )

        lines.extend([
            "",
            "---",
            "",
            "## ⚠️ Disclosed Limitations",
        ])
        for lim in report.limitations_noted:
            lines.append(f"- {lim}")

        lines.append("")
        dest.write_text("\n".join(lines), encoding="utf-8")
        return dest


# Global report generator
_report_generator = EvaluationReportGenerator()


def get_report_generator() -> EvaluationReportGenerator:
    """Return global singleton report generator."""
    return _report_generator
