"""Explainable Evidence Graph Module for TraceGuard AI."""

from typing import List, Optional
from app.core.models import (
    AgentPlan,
    BusinessVerificationResult,
    EvidenceEdge,
    EvidenceGraph,
    EvidenceNode,
    FirewallEvaluation,
    InjectionDetectionResult,
    IntentContract,
    PolicyDecision,
    RecoveryAction,
    SourceRecord,
    TaintStatus,
)


class EvidenceGraphBuilder:
    """Constructs a deterministic Directed Acyclic Graph (DAG) tracing security decision lineage."""

    @staticmethod
    def build_evidence_graph(
        intent: IntentContract,
        source: SourceRecord,
        injection_result: InjectionDetectionResult,
        plan: AgentPlan,
        evaluations: List[FirewallEvaluation],
        overall_decision: PolicyDecision,
        business_verification: Optional[BusinessVerificationResult] = None,
        recovery: Optional[RecoveryAction] = None,
    ) -> EvidenceGraph:
        """Synthesize explainable evidence graph linking intent, source, taint, business context, and firewall verdicts."""
        nodes: List[EvidenceNode] = []
        edges: List[EvidenceEdge] = []

        # 1. Intent Node
        intent_node_id = f"node_{intent.intent_id}"
        nodes.append(
            EvidenceNode(
                node_id=intent_node_id,
                node_type="INTENT",
                label=f"User Intent: {intent.user_goal}",
                metadata={
                    "intent_id": intent.intent_id,
                    "allowed_actions": intent.allowed_actions,
                    "source": intent.source,
                },
            )
        )

        # 2. Source Document Node
        source_node_id = f"node_{source.source_id}"
        nodes.append(
            EvidenceNode(
                node_id=source_node_id,
                node_type="SOURCE",
                label=f"Document: {source.original_filename} ({source.source_id})",
                metadata={
                    "source_id": source.source_id,
                    "content_hash": source.content_hash,
                    "trust_level": source.trust_level.value,
                },
            )
        )
        edges.append(
            EvidenceEdge(
                source_id=intent_node_id,
                target_id=source_node_id,
                relationship="authorized_processing_target",
            )
        )

        # 3. Injection Analysis Node
        inj_node_id = f"node_inj_{source.source_id}"
        nodes.append(
            EvidenceNode(
                node_id=inj_node_id,
                node_type="INJECTION",
                label=f"Injection Scan: {'DETECTED ⚠️' if injection_result.detected else 'CLEAN ✅'} ({injection_result.risk_level})",
                metadata={
                    "detected": injection_result.detected,
                    "risk_level": injection_result.risk_level,
                    "matched_patterns": injection_result.matched_patterns,
                },
            )
        )
        edges.append(
            EvidenceEdge(
                source_id=source_node_id,
                target_id=inj_node_id,
                relationship="inspected_by_heuristics",
            )
        )

        # 4. Taint Status Node
        taint_node_id = f"node_taint_{source.source_id}"
        nodes.append(
            EvidenceNode(
                node_id=taint_node_id,
                node_type="TAINT",
                label=f"Taint Status: {source.taint_status.value}",
                metadata={"taint_status": source.taint_status.value},
            )
        )
        edges.append(
            EvidenceEdge(
                source_id=inj_node_id,
                target_id=taint_node_id,
                relationship="determined_taint_tier",
            )
        )

        # 5. Business Verification Node (if available)
        bv_node_id = None
        if business_verification:
            bv_node_id = f"node_bv_{business_verification.verification_id}"
            nodes.append(
                EvidenceNode(
                    node_id=bv_node_id,
                    node_type="VENDOR_VERIFICATION",
                    label=f"Vendor Master: {business_verification.vendor_name or 'Unknown'} (Beneficiary: {'MATCH ✅' if business_verification.beneficiary_match else 'MISMATCH ❌'})",
                    metadata={
                        "vendor_found": business_verification.vendor_found,
                        "vendor_status": business_verification.vendor_status,
                        "beneficiary_match": business_verification.beneficiary_match,
                        "risk_level": business_verification.risk_level,
                    },
                )
            )
            edges.append(
                EvidenceEdge(
                    source_id=source_node_id,
                    target_id=bv_node_id,
                    relationship="cross_referenced_with_master",
                )
            )

        # 6. Plan Steps and Firewall Evaluation Nodes
        for step, ev in zip(plan.steps, evaluations):
            step_node_id = f"node_step_{step.step_id}"
            nodes.append(
                EvidenceNode(
                    node_id=step_node_id,
                    node_type="PLAN_STEP",
                    label=f"Proposed Action: {step.action_name} ({'TAINTED ⚠️' if step.is_tainted else 'CLEAN'})",
                    metadata={
                        "step_id": step.step_id,
                        "action_type": step.action_type.value,
                        "is_tainted": step.is_tainted,
                        "rationale": step.rationale,
                    },
                )
            )
            edges.append(
                EvidenceEdge(
                    source_id=source_node_id,
                    target_id=step_node_id,
                    relationship="synthesized_into_plan",
                )
            )

            # Link taint to step if tainted
            if step.is_tainted:
                edges.append(
                    EvidenceEdge(
                        source_id=taint_node_id,
                        target_id=step_node_id,
                        relationship="tainted_action_origin",
                    )
                )

            # Firewall Evaluation Node
            eval_node_id = f"node_eval_{ev.evaluation_id}"
            nodes.append(
                EvidenceNode(
                    node_id=eval_node_id,
                    node_type="FIREWALL_EVALUATION",
                    label=f"Action Firewall: {ev.action_name} ➔ {ev.decision.value}",
                    metadata={
                        "decision": ev.decision.value,
                        "reason": ev.reason,
                        "violated_constraints": ev.violated_constraints,
                    },
                )
            )
            edges.append(
                EvidenceEdge(
                    source_id=step_node_id,
                    target_id=eval_node_id,
                    relationship="submitted_for_authorization",
                )
            )
            edges.append(
                EvidenceEdge(
                    source_id=intent_node_id,
                    target_id=eval_node_id,
                    relationship="enforced_intent_boundary",
                )
            )
            if bv_node_id:
                edges.append(
                    EvidenceEdge(
                        source_id=bv_node_id,
                        target_id=eval_node_id,
                        relationship="enforced_business_constraints",
                    )
                )

        # 7. Final Verdict Node
        verdict_node_id = f"node_verdict_{overall_decision.value}"
        nodes.append(
            EvidenceNode(
                node_id=verdict_node_id,
                node_type="DECISION",
                label=f"Overall Firewall Verdict: {overall_decision.value}",
                metadata={"decision": overall_decision.value},
            )
        )
        for ev in evaluations:
            edges.append(
                EvidenceEdge(
                    source_id=f"node_eval_{ev.evaluation_id}",
                    target_id=verdict_node_id,
                    relationship="aggregated_verdict",
                )
            )

        # 8. Recovery Action Node (if provided)
        if recovery:
            rec_node_id = f"node_recovery_{recovery.action_type}"
            nodes.append(
                EvidenceNode(
                    node_id=rec_node_id,
                    node_type="RECOVERY",
                    label=f"Safe Recovery: {recovery.action_type}",
                    metadata={
                        "message": recovery.message,
                        "requires_firewall_reentry": recovery.requires_firewall_reentry,
                    },
                )
            )
            edges.append(
                EvidenceEdge(
                    source_id=verdict_node_id,
                    target_id=rec_node_id,
                    relationship="triggered_safe_recovery",
                )
            )

        summary = (
            f"Evidence Graph synthesized with {len(nodes)} nodes and {len(edges)} causal edges. "
            f"Lineage traced from Intent '{intent.intent_id}' and Source '{source.source_id}' "
            f"to final verdict '{overall_decision.value}'."
        )

        return EvidenceGraph(
            nodes=nodes,
            edges=edges,
            summary=summary,
        )
