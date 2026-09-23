import sys
from pathlib import Path

# Fix import resolution: ensure project root is at index 0 of sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Prevent package namespace collision if Streamlit loaded frontend/app.py as 'app'
if "app" in sys.modules and not hasattr(sys.modules["app"], "__path__"):
    del sys.modules["app"]

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
import requests
import streamlit as st

# Direct Python modules for deterministic offline DEMO MODE execution
from app.agent.intent_contract import create_intent_contract
from app.agent.planner import get_planner
from app.business.vendor_registry import get_vendor_registry
from app.business.vendor_verification import get_vendor_verification_engine
from app.core.models import (
    PolicyDecision,
    SensitiveActionType,
    TaintStatus,
)
from app.database.audit_logger import get_audit_logger
from app.evaluation.evaluator import get_batch_evaluator
from app.evaluation.scenario_models import list_all_scenarios, get_scenario_by_id
from app.ingestion.invoice_parser import parse_invoice_bytes
from app.provenance.evidence_graph import EvidenceGraphBuilder
from app.provenance.source_registry import get_source_registry
from app.provenance.taint_tracker import get_taint_tracker
from app.recovery.recovery_engine import get_recovery_engine
from app.security.action_firewall import get_action_firewall
from app.security.explanation_engine import get_explanation_engine
from app.security.injection_detector import detect_prompt_injection
from app.tools.mock_tools import MockTools

# Page configuration
st.set_page_config(
    page_title="TraceGuard AI | Action Firewall Console",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Enterprise Cybersecurity Console Theme CSS
st.markdown(
    """
    <style>
    /* Global Base Styling */
    .stApp {
        background-color: #0B0F19;
        color: #E2E8F0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Headers & Typography */
    h1, h2, h3, h4, h5, h6 {
        color: #F8FAFC !important;
        font-weight: 700;
        letter-spacing: -0.02em;
    }
    
    /* Top Header Bar */
    .top-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 10px;
        margin-bottom: 1.25rem;
    }
    .brand-title {
        font-size: 1.4rem;
        font-weight: 800;
        color: #38BDF8;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .brand-sub {
        font-size: 0.85rem;
        color: #94A3B8;
        margin-top: 0.1rem;
    }
    
    /* Badges */
    .badge-online {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.65rem;
        background: rgba(16, 185, 129, 0.15);
        color: #10B981;
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
    }
    .badge-demo {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.65rem;
        background: rgba(245, 158, 11, 0.15);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    /* Hero Banner */
    .hero-container {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .hero-title {
        font-size: 1.35rem;
        font-weight: 800;
        color: #F8FAFC;
        margin-bottom: 0.35rem;
        letter-spacing: -0.01em;
    }
    .hero-desc {
        font-size: 0.92rem;
        color: #94A3B8;
        margin-bottom: 1.25rem;
    }
    
    /* Status Cards */
    .status-card {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 8px;
        padding: 0.85rem 1rem;
        border-left: 3px solid #0284C7;
    }
    .status-card-title {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94A3B8;
        text-transform: uppercase;
    }
    .status-card-value {
        font-size: 1.1rem;
        font-weight: 800;
        color: #F8FAFC;
        margin: 0.2rem 0;
    }
    .status-card-sub {
        font-size: 0.75rem;
        color: #64748B;
    }
    
    /* Scenario Grid Cards */
    .scenario-card {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 10px;
        padding: 1.15rem;
        margin-bottom: 0.75rem;
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .scenario-card:hover {
        border-color: #0284C7;
    }
    .scenario-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    .scenario-num {
        font-size: 0.75rem;
        font-weight: 800;
        color: #0284C7;
        background: rgba(2, 132, 199, 0.15);
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
    }
    .scenario-name {
        font-size: 1rem;
        font-weight: 700;
        color: #F8FAFC;
    }
    .scenario-desc {
        font-size: 0.82rem;
        color: #94A3B8;
        margin-bottom: 0.75rem;
        min-height: 2.2rem;
    }
    
    /* Decision Badges */
    .pill-allow {
        background: rgba(16, 185, 129, 0.15);
        color: #10B981;
        border: 1px solid #10B981;
        padding: 0.2rem 0.55rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
    }
    .pill-block {
        background: rgba(239, 68, 68, 0.15);
        color: #EF4444;
        border: 1px solid #EF4444;
        padding: 0.2rem 0.55rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
    }
    .pill-ask {
        background: rgba(245, 158, 11, 0.15);
        color: #F59E0B;
        border: 1px solid #F59E0B;
        padding: 0.2rem 0.55rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    /* Decision Flow Visual Box */
    .flow-step-box {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    /* Action Firewall Hero Banner */
    .firewall-hero-allow {
        background: linear-gradient(135deg, rgba(6, 78, 59, 0.5) 0%, rgba(17, 24, 39, 0.9) 100%);
        border: 2px solid #10B981;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.25rem 0;
        text-align: center;
    }
    .firewall-hero-block {
        background: linear-gradient(135deg, rgba(127, 29, 29, 0.5) 0%, rgba(17, 24, 39, 0.9) 100%);
        border: 2px solid #EF4444;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.25rem 0;
        text-align: center;
    }
    .firewall-hero-ask {
        background: linear-gradient(135deg, rgba(120, 53, 15, 0.5) 0%, rgba(17, 24, 39, 0.9) 100%);
        border: 2px solid #F59E0B;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.25rem 0;
        text-align: center;
    }
    
    .big-decision-block {
        font-size: 2.2rem;
        font-weight: 900;
        color: #EF4444;
        letter-spacing: 0.05em;
        margin: 0.5rem 0;
    }
    .big-decision-allow {
        font-size: 2.2rem;
        font-weight: 900;
        color: #10B981;
        letter-spacing: 0.05em;
        margin: 0.5rem 0;
    }
    .big-decision-ask {
        font-size: 2.2rem;
        font-weight: 900;
        color: #F59E0B;
        letter-spacing: 0.05em;
        margin: 0.5rem 0;
    }

    /* Document Panel */
    .doc-panel {
        background: #0D131F;
        border: 1px solid #1E293B;
        border-radius: 8px;
        padding: 1rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.85rem;
        color: #E2E8F0;
        line-height: 1.5;
        white-space: pre-wrap;
    }
    .doc-highlight {
        background: rgba(239, 68, 68, 0.25);
        color: #FCA5A5;
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        font-weight: 700;
        border: 1px solid rgba(239, 68, 68, 0.5);
    }
    
    /* Why Box */
    .why-box {
        background: #111827;
        border: 1px solid #374151;
        border-left: 4px solid #EF4444;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .why-box-allow {
        background: #111827;
        border: 1px solid #374151;
        border-left: 4px solid #10B981;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    /* Recovery Box */
    .recovery-box {
        background: #111827;
        border: 1px solid #374151;
        border-left: 4px solid #F59E0B;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 0.75rem;
    }
    
    /* Sidebar Navigation */
    .sidebar-brand {
        padding: 0.5rem 0;
        border-bottom: 1px solid #1F2937;
        margin-bottom: 1rem;
    }
    .sidebar-status-box {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 8px;
        padding: 0.75rem;
        margin: 1rem 0;
    }
    .status-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        margin: 0.35rem 0;
    }
    .status-active {
        color: #10B981;
        font-weight: 700;
    }
    .status-safe {
        color: #38BDF8;
        font-weight: 700;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


def execute_pipeline(user_goal: str, invoice_text: str, filename: str) -> Dict[str, Any]:
    """Execute complete deterministic pipeline."""
    source_reg = get_source_registry()
    taint_trk = get_taint_tracker()
    vend_ver = get_vendor_verification_engine()
    pln = get_planner()
    firewall = get_action_firewall()
    expl = get_explanation_engine()
    rec_eng = get_recovery_engine()

    source = parse_invoice_bytes(filename=filename, content=invoice_text.encode("utf-8"), save_to_upload_dir=False)
    source_reg.register_source(source)
    detection = detect_prompt_injection(source.raw_text)
    updated_taint = taint_trk.evaluate_source_taint(source, detection)
    source = source.model_copy(update={"taint_status": updated_taint})

    bv = vend_ver.verify_invoice_business_context(source.source_id, source.extracted_fields)
    intent = create_intent_contract(user_goal=user_goal)
    plan = pln.generate_plan(intent=intent, source=source, injection_result=detection)

    evaluations = []
    tool_results = []
    has_blocked = False

    for step in plan.steps:
        ev = firewall.evaluate_step(
            step=step,
            intent=intent,
            source_id=source.source_id,
            source_taint_status=updated_taint,
            business_verification=bv,
        )
        evaluations.append(ev)
        tool_res = MockTools.execute_tool(step.action_name, step.arguments, ev)
        tool_results.append(tool_res)
        if ev.decision == PolicyDecision.BLOCK:
            has_blocked = True

    overall_decision = PolicyDecision.BLOCK if has_blocked else (
        PolicyDecision.ASK_USER if any(e.decision == PolicyDecision.ASK_USER for e in evaluations) else PolicyDecision.ALLOW
    )

    recovery = rec_eng.determine_recovery_action(overall_decision, evaluations, bv)
    explanation = expl.generate_explanation(overall_decision, intent, source, detection, evaluations, bv)
    evidence_graph = EvidenceGraphBuilder.build_evidence_graph(intent, source, detection, plan, evaluations, overall_decision, bv, recovery)

    return {
        "source": source.model_dump(mode="json"),
        "injection_result": detection.model_dump(mode="json"),
        "intent": intent.model_dump(mode="json"),
        "plan": plan.model_dump(mode="json"),
        "business_verification": bv.model_dump(mode="json"),
        "evaluations": [e.model_dump(mode="json") for e in evaluations],
        "tool_results": [t.model_dump(mode="json") for t in tool_results],
        "overall_decision": overall_decision.value,
        "explanation": explanation,
        "recovery": recovery.model_dump(mode="json") if recovery else None,
        "evidence_graph": evidence_graph.model_dump(mode="json"),
    }


# ==============================================================================
# SIDEBAR NAVIGATION & SYSTEM STATUS
# ==============================================================================
with st.sidebar:
    st.markdown(
        """
        <div class='sidebar-brand'>
            <div style='font-size: 1.25rem; font-weight: 800; color: #38BDF8;'>🛡️ TRACEGUARD AI</div>
            <div style='font-size: 0.78rem; color: #94A3B8;'>Explainable Action Firewall</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    selected_tab = st.radio(
        "Navigation",
        [
            "● LIVE SECURITY",
            "● ATTACK PLAYGROUND",
            "● EVALUATION",
            "● VENDOR TRUST",
            "● AUDIT TRAIL",
            "● ARCHITECTURE",
        ],
        label_visibility="collapsed",
    )

    st.markdown(
        """
        <div class='sidebar-status-box'>
            <div style='font-size: 0.75rem; font-weight: 700; color: #94A3B8; margin-bottom: 0.5rem; text-transform: uppercase;'>SYSTEM STATUS</div>
            <div class='status-row'><span>Firewall</span><span class='status-active'>ACTIVE</span></div>
            <div class='status-row'><span>Provenance</span><span class='status-active'>ACTIVE</span></div>
            <div class='status-row'><span>Taint Tracking</span><span class='status-active'>ACTIVE</span></div>
            <div class='status-row'><span>Audit Logger</span><span class='status-active'>ACTIVE</span></div>
            <div class='status-row'><span>Mock Tools</span><span class='status-safe'>SAFE</span></div>
        </div>
        
        <div style='text-align: center; padding: 0.5rem; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 6px;'>
            <div style='font-size: 0.72rem; font-weight: 700; color: #F59E0B;'>DEMO ENVIRONMENT</div>
            <div style='font-size: 0.68rem; color: #94A3B8;'>NO REAL FINANCIAL ACTIONS</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# TOP HEADER BAR
# ==============================================================================
st.markdown(
    """
    <div class='top-header'>
        <div>
            <div class='brand-title'>🛡️ TRACEGUARD AI</div>
            <div class='brand-sub'>Untrusted Content ➔ Trusted Action | Explainable Runtime Security for AI Agents</div>
        </div>
        <div style='display: flex; gap: 0.5rem; align-items: center;'>
            <span class='badge-online'>● SYSTEM ONLINE</span>
            <span class='badge-demo'>DEMO MODE: No Real Financial Actions</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)


# Load Scenarios
all_scenarios = list_all_scenarios()
scenario_map = {s.scenario_id: s for s in all_scenarios}

# 6 Key Quick-Demo Presets
KEY_PRESETS = ["SCN-01-CLEAN", "SCN-02-INJECTION-BASIC", "SCN-03-BENEFICIARY-MANIPULATION", "SCN-04-DATA-EXFILTRATION", "SCN-06-BENEFICIARY-MISMATCH-CLEAN-TEXT", "SCN-05-COMBO-ATTACK"]


# ==============================================================================
# VIEW 1 & 2: LIVE SECURITY & ATTACK PLAYGROUND
# ==============================================================================
if selected_tab in ["● LIVE SECURITY", "● ATTACK PLAYGROUND"]:

    # Hero Section: Core Statement & 4 Status Cards
    st.markdown(
        """
        <div class='hero-container'>
            <div class='hero-title'>PROTECTING AI AGENTS: UNTRUSTED CONTENT ➔ UNAUTHORIZED ACTIONS</div>
            <div class='hero-desc'>TraceGuard evaluates every sensitive agent action deterministically before execution.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown(
            """
            <div class='status-card'>
                <div class='status-card-title'>Firewall Policy</div>
                <div class='status-card-value'>ACTIVE</div>
                <div class='status-card-sub'>Deny by default enforced</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c2:
        st.markdown(
            """
            <div class='status-card'>
                <div class='status-card-title'>Taint Tracking</div>
                <div class='status-card-value'>ACTIVE</div>
                <div class='status-card-sub'>Sticky provenance flow</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c3:
        st.markdown(
            """
            <div class='status-card'>
                <div class='status-card-title'>Business Trust</div>
                <div class='status-card-value'>ACTIVE</div>
                <div class='status-card-sub'>Vendor master verification</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c4:
        st.markdown(
            """
            <div class='status-card'>
                <div class='status-card-title'>Audit Trail</div>
                <div class='status-card-value'>ACTIVE</div>
                <div class='status-card-sub'>Immutable & explainable</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("### ⚔️ Attack Playground — Threat Scenarios")
    st.caption("Select a scenario from the quick cards below, or select from all 25 expanded benchmark scenarios:")

    if "active_scen_id" not in st.session_state:
        st.session_state["active_scen_id"] = "SCN-01-CLEAN"

    # 2-Column Responsive Grid of 6 Key Scenario Cards
    col_left, col_right = st.columns(2)

    with col_left:
        for sk in ["SCN-01-CLEAN", "SCN-03-BENEFICIARY-MANIPULATION", "SCN-06-BENEFICIARY-MISMATCH-CLEAN-TEXT"]:
            sc = scenario_map.get(sk)
            if sc:
                badge_class = "pill-allow" if sc.expected_decision.value == "ALLOW" else "pill-block"
                st.markdown(
                    f"""
                    <div class='scenario-card'>
                        <div class='scenario-header'>
                            <div>
                                <span class='scenario-num'>{sc.scenario_id[:6]}</span>
                                <span class='scenario-name'>{sc.name}</span>
                            </div>
                            <span class='{badge_class}'>Expected: {sc.expected_decision.value}</span>
                        </div>
                        <div class='scenario-desc'>{sc.description}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                if st.button(f"RUN {sc.scenario_id}", key=f"btn_run_{sk}"):
                    st.session_state["active_scen_id"] = sk

    with col_right:
        for sk in ["SCN-02-INJECTION-BASIC", "SCN-04-DATA-EXFILTRATION", "SCN-05-COMBO-ATTACK"]:
            sc = scenario_map.get(sk)
            if sc:
                badge_class = "pill-allow" if sc.expected_decision.value == "ALLOW" else "pill-block"
                st.markdown(
                    f"""
                    <div class='scenario-card'>
                        <div class='scenario-header'>
                            <div>
                                <span class='scenario-num'>{sc.scenario_id[:6]}</span>
                                <span class='scenario-name'>{sc.name}</span>
                            </div>
                            <span class='{badge_class}'>Expected: {sc.expected_decision.value}</span>
                        </div>
                        <div class='scenario-desc'>{sc.description}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                if st.button(f"RUN {sc.scenario_id}", key=f"btn_run_{sk}"):
                    st.session_state["active_scen_id"] = sk

    # Full Scenario Selector (All 25 Scenarios)
    st.markdown("---")
    scen_select_opts = [f"{s.scenario_id} — {s.name} ({s.expected_decision.value})" for s in all_scenarios]
    curr_idx = next((i for i, s in enumerate(all_scenarios) if s.scenario_id == st.session_state["active_scen_id"]), 0)
    selected_option = st.selectbox("Or choose from all 25 benchmark scenarios:", scen_select_opts, index=curr_idx)
    selected_scen_id = selected_option.split(" — ")[0]
    st.session_state["active_scen_id"] = selected_scen_id

    active_scen = scenario_map[selected_scen_id]

    # Execute Scenario
    user_intent_text = active_scen.user_goal
    run_result = execute_pipeline(
        user_goal=user_intent_text,
        invoice_text=active_scen.invoice_text,
        filename=f"{active_scen.scenario_id.lower()}.txt",
    )

    source = run_result["source"]
    inj = run_result["injection_result"]
    bv = run_result.get("business_verification", {})
    plan = run_result["plan"]
    evals = run_result["evaluations"]
    tools = run_result["tool_results"]
    overall_dec = run_result["overall_decision"]
    recovery = run_result.get("recovery")

    st.markdown(f"### 🔍 Threat Investigation: **{active_scen.name}**")

    # Immutable User Intent Box
    st.markdown(
        f"""
        <div style='background: #111827; border: 1px solid #1E293B; border-radius: 8px; padding: 0.85rem 1.25rem; margin-bottom: 1.25rem;'>
            <div style='font-size: 0.72rem; font-weight: 800; color: #38BDF8; letter-spacing: 0.05em;'>IMMUTABLE USER INTENT CONTRACT</div>
            <div style='font-size: 0.95rem; font-weight: 600; color: #F8FAFC; margin-top: 0.2rem;'>"{user_intent_text}"</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Document View & Security Decision Flow
    col_doc, col_flow = st.columns([1, 1])

    with col_doc:
        st.markdown("##### 📄 Untrusted Document Payload")
        doc_content = active_scen.invoice_text
        st.markdown(f"<div class='doc-panel'>{doc_content}</div>", unsafe_allow_html=True)

    with col_flow:
        st.markdown("##### 🛡️ Security Decision Flow")
        f1 = ("USER INTENT", "🟢 AUTHORIZED", "pill-allow")
        f2 = ("SOURCE TRUST", "🟠 UNTRUSTED", "pill-ask")
        f3 = ("INJECTION SCAN", "🔴 DETECTED" if inj["detected"] else "🟢 CLEAN", "pill-block" if inj["detected"] else "pill-allow")
        f4 = ("TAINT / PROVENANCE", f"🔴 {source['taint_status']}" if source["taint_status"] == "TAINTED" else "🟢 CLEAN", "pill-block" if source["taint_status"] == "TAINTED" else "pill-allow")
        f5 = ("BUSINESS VERIFICATION", "🟢 VERIFIED" if bv.get("beneficiary_match") else "🔴 MISMATCH", "pill-allow" if bv.get("beneficiary_match") else "pill-block")
        
        target_act = plan["steps"][-1]["action_name"] if plan["steps"] else "prepare_payment_draft"
        act_pill = "pill-block" if overall_dec == "BLOCK" else "pill-allow"
        f6 = ("PROPOSED ACTION", target_act, act_pill)
        f7 = ("ACTION FIREWALL", overall_dec, "pill-allow" if overall_dec == "ALLOW" else ("pill-ask" if overall_dec == "ASK_USER" else "pill-block"))

        for stage, status_txt, badge_css in [f1, f2, f3, f4, f5, f6, f7]:
            st.markdown(
                f"""
                <div class='flow-step-box'>
                    <span style='font-size: 0.85rem; font-weight: 700; color: #E2E8F0;'>{stage}</span>
                    <span class='{badge_css}'>{status_txt}</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # HERO ACTION FIREWALL DECISION SCREEN
    st.markdown("<br>", unsafe_allow_html=True)
    if overall_dec == "ALLOW":
        st.markdown(
            f"""
            <div class='firewall-hero-allow'>
                <div style='font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em; color: #10B981; text-transform: uppercase;'>🛡️ ACTION FIREWALL — VERIFIED & PERMITTED</div>
                <div style='font-size: 0.88rem; color: #CBD5E1; margin-bottom: 0.5rem;'>Action verified against intent, taint analysis, and approved vendor registry</div>
                <div class='big-decision-allow'>✓ ALLOWED</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown(
            f"""
            <div class='why-box-allow'>
                <div style='font-size: 0.85rem; font-weight: 800; color: #10B981; text-transform: uppercase;'>WHY WAS THIS ACTION PERMITTED?</div>
                <div style='font-size: 0.95rem; color: #E2E8F0; margin-top: 0.35rem;'>
                    • Source document contains no detected prompt-injection attacks.<br>
                    • Vendor is verified active in the approved corporate vendor registry.<br>
                    • Stated beneficiary account matches the registered account on file.<br>
                    • Action aligns strictly with the immutable User Intent Contract.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    elif overall_dec == "ASK_USER":
        st.markdown(
            f"""
            <div class='firewall-hero-ask'>
                <div style='font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em; color: #F59E0B; text-transform: uppercase;'>🛡️ ACTION FIREWALL — HUMAN CONFIRMATION REQUIRED</div>
                <div style='font-size: 0.88rem; color: #CBD5E1; margin-bottom: 0.5rem;'>Sensitive action gated pending explicit user confirmation</div>
                <div class='big-decision-ask'>⚠️ ASK USER</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown(
            f"""
            <div class='why-box'>
                <div style='font-size: 0.85rem; font-weight: 800; color: #F59E0B; text-transform: uppercase;'>WHY WAS THIS ACTION GATED?</div>
                <div style='font-size: 0.95rem; color: #E2E8F0; margin-top: 0.35rem;'>
                    {run_result.get('explanation', 'Policy constraint gated.')}
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            f"""
            <div class='firewall-hero-block'>
                <div style='font-size: 1.15rem; font-weight: 800; letter-spacing: 0.05em; color: #EF4444; text-transform: uppercase;'>🛡️ ACTION FIREWALL — THREAT INTERCEPTED</div>
                <div style='font-size: 0.88rem; color: #CBD5E1; margin-bottom: 0.5rem;'>Unauthorized sensitive agent action intercepted and blocked before execution</div>
                <div class='big-decision-block'>🛑 BLOCKED</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown(
            f"""
            <div class='why-box'>
                <div style='font-size: 0.85rem; font-weight: 800; color: #EF4444; text-transform: uppercase;'>WHY WAS THIS ACTION BLOCKED?</div>
                <div style='font-size: 0.95rem; color: #E2E8F0; margin-top: 0.35rem;'>
                    {run_result.get('explanation', 'Policy constraint violated.')}
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Safe Recovery Recommendation
    if recovery:
        st.markdown(
            f"""
            <div class='recovery-box'>
                <div style='font-size: 0.78rem; font-weight: 800; color: #F59E0B; text-transform: uppercase;'>Deterministic Safe Recovery Recommendation</div>
                <div style='font-size: 0.95rem; font-weight: 700; color: #F8FAFC; margin: 0.25rem 0;'>Action: <code>{recovery['action_type']}</code></div>
                <div style='font-size: 0.85rem; color: #CBD5E1;'>{recovery['message']}</div>
                <div style='font-size: 0.78rem; color: #94A3B8; margin-top: 0.35rem;'>Requires Firewall Re-entry: <strong>{recovery['requires_firewall_reentry']}</strong></div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Technical Evidence (Moved under expandable section)
    with st.expander("▼ View Technical Evidence & Causal Graph"):
        st.markdown("#### Structured Evidence & Provenance Lineage")
        st.json({
            "intent_id": run_result["intent"]["intent_id"],
            "source_id": source["source_id"],
            "content_hash": source["content_hash"],
            "injection_detected": inj["detected"],
            "risk_level": inj["risk_level"],
            "matched_patterns": inj["matched_patterns"],
            "taint_status": source["taint_status"],
            "vendor_verification": bv,
            "proposed_plan": plan,
            "firewall_evaluations": evals,
            "overall_decision": overall_dec,
            "recovery_action": recovery,
            "evidence_graph": run_result.get("evidence_graph"),
        })


# ==============================================================================
# VIEW 3: SECURITY EVALUATION
# ==============================================================================
elif selected_tab == "● EVALUATION":
    st.markdown("### 📊 Security Evaluation & Attack Benchmark Matrix")
    st.caption("Empirical metrics measured against the N=25 synthetic benchmark suite under deterministic Action Firewall gating:")

    eval_report = get_batch_evaluator().run_full_evaluation()
    m = eval_report.metrics

    mc1, mc2, mc3, mc4 = st.columns(4)
    with mc1:
        st.markdown(
            f"""
            <div class='status-card' style='border-left-color: #10B981;'>
                <div class='status-card-title'>Attack Success Rate</div>
                <div class='status-card-value' style='color: #10B981;'>{m.attack_success_rate}%</div>
                <div class='status-card-sub'>0 unauthorized breaches</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with mc2:
        st.markdown(
            f"""
            <div class='status-card' style='border-left-color: #38BDF8;'>
                <div class='status-card-title'>Malicious Block Rate</div>
                <div class='status-card-value' style='color: #38BDF8;'>{m.block_rate}%</div>
                <div class='status-card-sub'>All attacks intercepted</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with mc3:
        st.markdown(
            f"""
            <div class='status-card' style='border-left-color: #10B981;'>
                <div class='status-card-title'>False Positive Rate</div>
                <div class='status-card-value' style='color: #10B981;'>{m.false_positive_rate}%</div>
                <div class='status-card-sub'>Clean invoices allowed</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with mc4:
        st.markdown(
            f"""
            <div class='status-card' style='border-left-color: #A855F7;'>
                <div class='status-card-title'>Intent Catch Rate</div>
                <div class='status-card-value' style='color: #A855F7;'>{m.intent_violation_catch_rate}%</div>
                <div class='status-card-sub'>Rogue expansions caught</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)
    st.info(
        "ℹ️ **Benchmark Sample Size**: Synthetic benchmark suite ($N=25$). "
        "These results are from the curated synthetic benchmark and do not represent a guarantee of real-world protection against arbitrary real-world attacks."
    )

    st.markdown("#### 🧪 Benchmark Scenario Test Matrix (25 Scenarios)")
    matrix_rows = []
    for r in eval_report.scenario_results:
        matrix_rows.append({
            "Scenario ID": r.scenario_id,
            "Scenario Name": r.name,
            "Category": r.category,
            "Expected": r.expected_decision,
            "Actual": r.actual_decision,
            "Injection Detected": "YES ⚠️" if r.actual_injection else "NO ✓",
            "Taint Status": r.actual_taint,
            "Latency": f"{r.latency_ms} ms",
            "Result": "PASS ✓" if r.passed else "FAIL ✕",
        })
    st.dataframe(matrix_rows)


# ==============================================================================
# VIEW 4: VENDOR TRUST REGISTRY
# ==============================================================================
elif selected_tab == "● VENDOR TRUST":
    st.markdown("### 🏢 Approved Corporate Vendor Master Registry")
    st.caption("Whitelisted corporate entities and registered beneficiary accounts for business-context verification:")

    vendors = get_vendor_registry().list_vendors()
    vendor_rows = []
    for v in vendors:
        vendor_rows.append({
            "Vendor ID": v.vendor_id,
            "Vendor Name": v.name,
            "Status": f"🟢 {v.status}",
            "Approved Beneficiary Account": v.approved_beneficiary,
            "Known Aliases": ", ".join(v.aliases) if v.aliases else "None",
        })
    st.dataframe(vendor_rows)

    st.markdown(
        """
        <div style='background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 1rem; margin-top: 1rem;'>
            <div style='font-size: 0.8rem; font-weight: 700; color: #38BDF8;'>BUSINESS VERIFICATION PRINCIPLE</div>
            <div style='font-size: 0.82rem; color: #94A3B8; margin-top: 0.25rem;'>
                Even if an invoice passes prompt-injection inspection without plain-text attack signatures, if its stated beneficiary account does NOT match the approved vendor registry, the Action Firewall strictly issues a <strong>BLOCK</strong> decision.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# VIEW 5: AUDIT TRAIL
# ==============================================================================
elif selected_tab == "● AUDIT TRAIL":
    st.markdown("### 📜 Immutable Security Audit Event Stream")
    st.caption("Cryptographically verifiable, chronological audit log recording every tool authorization decision:")

    events = get_audit_logger().list_events(limit=30)
    if events:
        for ev in reversed(events):
            dec_color = "#10B981" if ev.decision == "ALLOW" else ("#F59E0B" if ev.decision == "ASK_USER" else "#EF4444")
            with st.expander(f"🛡️ [{ev.decision}] {ev.action_type.value if hasattr(ev.action_type, 'value') else ev.action_type} — Event {ev.event_id} ({ev.timestamp.strftime('%H:%M:%S UTC')})"):
                st.markdown(f"**Action Type:** `{ev.action_type}` | **Decision:** <span style='color:{dec_color};font-weight:700;'>{ev.decision}</span>", unsafe_allow_html=True)
                st.markdown(f"**Source Document:** `{ev.source_id}` | **Intent Contract:** `{ev.intent_id}`")
                st.markdown(f"**Reasoning:** {ev.reason}")
                st.markdown(f"**Taint Status:** `{ev.taint_status}`")
    else:
        st.info("No audit events recorded yet. Run a scenario from the Live Security tab to generate events.")


# ==============================================================================
# VIEW 6: ARCHITECTURE & PRINCIPLES
# ==============================================================================
elif selected_tab == "● ARCHITECTURE":
    st.markdown("### 🏛️ TraceGuard AI Architecture & Security Principles")
    st.caption("Defense-in-depth runtime isolation for tool-using AI agents:")

    st.code(
        """
        USER INTENT CONTRACT (IMMUTABLE)
                      │
                      ▼
        SOURCE GATEWAY (Ingest, Sanitize, SHA-256 Hash)
                      │
                      ▼
        PROMPT-INJECTION HEURISTICS (Pattern Detection)
                      │
                      ▼
        TAINT TRACKING (Sticky Provenance Flow)
                      │
                      ▼
        BUSINESS CONTEXT VERIFICATION (Vendor Registry & Beneficiary Integrity)
                      │
                      ▼
        AGENT PLANNER (Constrained Reasoning)
                      │
                      ▼
        🛡️ ACTION FIREWALL (Deterministic Multi-Constraint Policy Gating)
                      │
           ┌──────────┴──────────┬──────────┐
           ▼                     ▼          ▼
        [ALLOW]             [ASK USER]   [BLOCK]
           │                     │          │
           ▼                     ▼          │
        Safe Mock Tool (Simulated Only)     │
           │                                │
           └──────────────┬─────────────────┘
                          │
                          ▼
        Safe Recovery Engine & Explainable Evidence Graph
                          │
                          ▼
        Immutable Audit Record & Benchmark Evaluation Matrix
        """,
        language="text",
    )

    st.markdown("---")
    st.markdown("#### 🔒 Core Guarantees")
    g1, g2 = st.columns(2)
    with g1:
        st.markdown(
            """
            - **LLM ≠ Final Security Authority**: LLMs can be confused or manipulated by malicious documents; the deterministic Action Firewall makes the final binding decision.
            - **External Documents = Data, Not Authority**: Text within an invoice is treated as passive data and cannot override user intent.
            """
        )
    with g2:
        st.markdown(
            """
            - **Deny-by-Default Execution**: Unregistered or unmapped tool actions are denied automatically.
            - **Firewall Re-entry Required**: Recovery recommendations cannot bypass security checks upon retry.
            """
        )

    st.markdown("---")
    st.markdown("#### 👥 Team INNVOX — FORGEX AI 2026")
    st.markdown(
        """
        - **Vijith R**
        - **Yogeshwaran M**
        - **Rokindh L**
        - **Jayakumar M**
        """
    )
