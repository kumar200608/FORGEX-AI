# TraceGuard AI — Jury Quick Reference Guide

**Project**: TraceGuard AI  
**Event**: FORGEX AI 2026 | Problem Statement AI-2  
**Team**: INNVOX  

Use this quick-reference cheat sheet when answering jury questions during demonstrations.

---

## Direct Code Location Q&A

### Q1: Prompt Injection detection enga irukku? (Where is injection detection?)
**File**: `app/security/injection_detector.py`  
**What it does**: Detects prompt injection signatures, authority overrides, base64-encoded strings, URL encoding, homoglyphs, and zero-width characters using multi-pattern heuristic scanning.

---

### Q2: Action blocking enga nadakkudhu? (Where is action blocking enforced?)
**File**: `app/security/action_firewall.py`  
**What it does**: Inspects every agent-proposed action step against the immutable User Intent Contract, taint status, and vendor registry. If an unauthorized tool or mismatched beneficiary is requested, it deterministically returns `PolicyDecision.BLOCK`.

---

### Q3: User Intent contract enga check pannreenga? (Where is User Intent managed?)
**File**: `app/agent/intent_contract.py`  
**What it does**: Generates frozen, immutable Pydantic `IntentContract` objects locking allowed actions (e.g., `["read_invoice", "prepare_payment_draft"]`). Untrusted external documents cannot modify this boundary.

---

### Q4: Taint Tracking enga irukku? (Where is taint tracking?)
**File**: `app/provenance/taint_tracker.py`  
**What it does**: Evaluates source trust. If injection or untrusted external content is identified, it marks the document with `TaintStatus.TAINTED` and propagates taint to downstream plan steps.

---

### Q5: Vendor / Beneficiary verification enga irukku? (Where is vendor verification?)
**File**: `app/business/vendor_verification.py` & `app/business/vendor_registry.py`  
**What it does**: Matches extracted invoice vendors against an approved master registry. Compares the stated beneficiary account against the approved bank account and flags mismatches with business risk ratings.

---

### Q6: Multi-format upload / parsing enga irukku? (Where is multi-format extraction?)
**Directory**: `app/ingestion/extractors/` & `universal_extractor.py`  
**What it does**: Contains sandboxed parsers for **10 formats**: PDF (`pdf_parser.py`), DOCX (`docx_parser.py`), Email EML (`email_parser.py`), CSV (`csv_parser.py`), JSON (`json_parser.py`), XML (`xml_parser.py`), HTML (`html_parser.py`), Text/MD (`text_parser.py`), and Images (`image_ocr.py`).

---

### Q7: Evidence chain / Causal graph enga build aagudhu? (Where is evidence lineage?)
**File**: `app/provenance/evidence_graph.py`  
**What it does**: Builds a Directed Acyclic Graph (DAG) connecting `Intent → Source → Injection → Taint → Business Verification → Planned Action → Firewall Verdict → Recovery Action`.

---

### Q8: Audit trail enga store aagudhu? (Where is audit logging?)
**File**: `app/database/audit_logger.py`  
**What it does**: Stores immutable `AuditEvent` records with cryptographic source IDs, intent IDs, action types, decisions, reasons, and UTC timestamps.

---

### Q9: Mock tools execute aaguma? Real payment poguma? (Do mock tools execute real actions?)
**File**: `app/tools/mock_tools.py`  
**What it does**: Uses safe simulated mock tools (`prepare_payment_draft`, `change_beneficiary`, `send_external_email`, `execute_database_command`). Gated strictly by Action Firewall tokens. **Zero real financial or email transactions occur.**

---

### Q10: 25 Benchmark scenarios & Metrics enga calculate pannreenga? (Where is evaluation?)
**Directory**: `app/evaluation/`  
- `scenario_models.py`: 25 test cases (20 malicious, 5 benign).
- `metrics.py`: Computes Attack Success Rate (0.0%), Malicious Block Rate (100.0%), and False Positive Rate (0.0%).
- `attack_runner.py` & `evaluator.py`: Executes scenarios against the live Action Firewall.

---

### Q11: React Frontend and UI components enga irukku? (Where is frontend code?)
**Directory**: `frontend/src/`  
- `pages/LiveSecurity.jsx`: Primary 5-scenario demo console.
- `pages/UniversalScanner.jsx`: Drag & Drop 10-format scanner.
- `pages/AttackPlayground.jsx`: 25-scenario evaluation runner.
- `pages/Evaluation.jsx`: Metric dashboard with confusion matrix.
- `services/api.js`: Multi-port discovering API client.

---

### Q12: API endpoints & FastAPI backend entrypoint?
**Files**: `app/main.py` (FastAPI app) & `app/api/routes.py` (REST endpoints).

---

## 1-Minute Jury Demo Flow

1. Open **Live Security** page (`/live-security`).
2. Select **Scenario 2: Prompt Injection** (Malicious invoice).
3. Click **Run Security Pipeline**.
4. Show the jury:
   - **Step 1-2**: Untrusted source ingested with `trust_level=LOW`.
   - **Step 3-4**: Heuristics detect prompt injection signature $\to$ Taint tagged `TAINTED`.
   - **Step 5**: Agent planner proposes `change_beneficiary` to attacker account.
   - **Step 6-7**: Action Firewall intercepts action $\to$ **🔴 BLOCK**.
   - **Step 8**: Explainable reasons displayed (*"Action violates User Intent Contract"*).
   - **Step 9**: Expand **Causal Evidence DAG** showing full lineage.
   - **Step 10**: Show immutable **Audit Trail** entry recorded.
