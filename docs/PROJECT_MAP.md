# TraceGuard AI — Master Project Map

**Project**: TraceGuard AI  
**Event**: FORGEX AI 2026 | Problem Statement AI-2  
**Team**: INNVOX  
**Focus**: Indirect Prompt-Injection Firewall & Runtime Defense for Tool-Using AI Agents  

---

## 1. Project Purpose

Large Language Model (LLM) agents operating in business environments (such as invoice reconciliation, email parsing, ERP synchronization, and automated payment drafting) are vulnerable to **Indirect Prompt Injection**. Adversaries embed hidden malicious directives inside passive external documents (e.g., invoices, emails, spreadsheets, PDFs). When an agent processes these documents, the embedded instructions hijack the agent's planning logic to trigger unauthorized actions—such as modifying wire beneficiaries, issuing unauthorized payments, or exfiltrating confidential records.

**TraceGuard AI** provides an **Explainable, Deterministic Action Firewall** positioned directly between the AI Agent Planner and Sensitive Execution Tools. It enforces:
1. **Immutable User Intent Contracts**: Boundary-locked policies that cannot be modified by document content.
2. **Cryptographic Provenance & Taint Tracking**: Persistent labeling of untrusted data flows.
3. **Vendor Master Verification**: Verification of corporate payment instructions against approved registries.
4. **Deterministic Policy Gating**: Evaluates every proposed action step to `ALLOW`, `ASK_USER`, or `BLOCK`.
5. **Causal Evidence Lineage DAG**: Complete explainable trace from raw input to security verdict.
6. **Immutable Audit Logging**: Tamper-evident logging of all security decisions.

---

## 2. Core Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   User Intent Contract                 │
│         (e.g., "Read invoice & draft payment")         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               Untrusted External Document              │
│       (PDF, Word, Email, CSV, JSON, XML, HTML, TXT)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│            Ingestion & Multi-Format Extractors         │
│   (Sandboxed text extraction, SHA-256 content hash)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Source Registry & Provenance               │
│   (Trust Level: UNTRUSTED_EXTERNAL, Taint: UNTRUSTED)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│          Indirect Prompt Injection Detection           │
│    (Regex heuristics, Obfuscation, Homoglyphs, B64)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 Taint Tracking Engine                  │
│       (Propagates TAINTED tag to downstream steps)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              Business Vendor Verification              │
│      (Validates beneficiary against Vendor Master)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Agent Planner                        │
│         (Synthesizes proposed action plan)             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               Deterministic Action Firewall            │
│       (Inspects intent, taint, vendor registry)        │
└───────────────┬───────────────────┬────────────────────┘
                │                   │
    ┌───────────▼────────┐  ┌───────▼──────────┐
    │  ALLOW / ASK_USER  │  │      BLOCK       │
    │ (Safe Mock Tool)   │  │(Execution Denied)│
    └───────────┬────────┘  └───────┬──────────┘
                │                   │
┌───────────────▼───────────────────▼────────────────────┐
│      Evidence Lineage DAG + Safe Recovery Engine       │
│           + Tamper-Evident Audit Trail Logger          │
└────────────────────────────────────────────────────────┘
```

---

## 3. Backend File Map

### Core & Configuration
- **File**: `app/main.py`
  - **Purpose**: FastAPI application entrypoint, CORS setup, middleware configuration, API router registration.
  - **Called By**: Uvicorn ASGI server.
  - **Why**: Bootstraps the backend web service.

- **File**: `app/core/config.py`
  - **Purpose**: Pydantic settings management, environment variable loading, upload path configuration.
  - **Called By**: All backend modules.
  - **Why**: Centralizes system configuration and security thresholds.

- **File**: `app/core/models.py`
  - **Purpose**: Pydantic data schemas, security enums (`PolicyDecision`, `TaintStatus`, `TrustLevel`, `SensitiveActionType`, `SourceType`).
  - **Called By**: All backend modules, API routes, and test suites.
  - **Why**: Ensures type safety and strict schema validation.

- **File**: `app/core/security.py`
  - **Purpose**: Filename sanitization, path traversal prevention, file size limits, MIME signature validation.
  - **Called By**: Ingestion and API routes.
  - **Why**: Defends against filesystem escape exploits and oversized payload attacks.

---

### Ingestion & Multi-Format Extractors
- **File**: `app/ingestion/extractors/universal_extractor.py`
  - **Purpose**: Master multi-format ingestion dispatcher for 10 document formats.
  - **Input**: Raw upload bytes + filename.
  - **Output**: Validated `SourceRecord` + `UniversalUploadResponse`.
  - **Called By**: `POST /sources/upload` and `POST /sources/analyze-pipeline`.

- **File**: `app/ingestion/invoice_parser.py`
  - **Purpose**: Domain-specific invoice field extraction (Vendor, Amount, Currency, Beneficiary Account, Due Date).
  - **Input**: Raw text/bytes.
  - **Output**: Key-value dictionary of extracted invoice fields.
  - **Called By**: Invoice routes and pipeline.

- **Extractors in `app/ingestion/extractors/`**:
  - `pdf_parser.py`: PDF text layer extraction with `%PDF-` signature check.
  - `docx_parser.py`: Safe Word paragraph and table extraction via `python-docx`.
  - `email_parser.py`: RFC 822 Email (`.eml`) header/body extraction.
  - `text_parser.py`: Plain text (`.txt`) and Markdown (`.md`) decoder.
  - `csv_parser.py`: CSV table normalizer with DDE formula prefix neutralization (`=`, `+`, `-`, `@`).
  - `json_parser.py`: JSON structured data extractor.
  - `xml_parser.py`: XML parser with XXE & Billion Laughs protection.
  - `html_parser.py`: HTML visible text extractor with active script stripping.
  - `image_ocr.py`: Image format validator and local OCR extractor.

---

### Security & Firewall Layer
- **File**: `app/security/action_firewall.py`
  - **Purpose**: Deterministic Action Firewall evaluating proposed actions against Intent, Taint, and Business context.
  - **Input**: `PlanStep`, `IntentContract`, `source_id`, `TaintStatus`, `BusinessVerificationResult`.
  - **Output**: `FirewallEvaluation` (`ALLOW` | `ASK_USER` | `BLOCK`) with explainable reason and violated constraints.
  - **Called By**: API routes, pipeline, evaluation attack runner.
  - **Why**: Acts as the non-bypassable security boundary before sensitive tool execution.

- **File**: `app/security/injection_detector.py`
  - **Purpose**: Multi-pattern heuristic detector for indirect prompt injection, homoglyphs, URL encoding, Base64 strings.
  - **Input**: Raw document text.
  - **Output**: `InjectionDetectionResult` (`detected`, `risk_level`, `matched_patterns`, `reason`).
  - **Called By**: Ingestion, pipeline, evaluation benchmark.

- **File**: `app/security/explanation_engine.py`
  - **Purpose**: Synthesizes human-readable and technical security explanations.
  - **Input**: Overall decision, intent contract, source record, injection result, evaluations.
  - **Output**: Structured narrative explaining why an action was allowed or blocked.

---

### Provenance & Evidence
- **File**: `app/provenance/source_registry.py`
  - **Purpose**: In-memory registry tracking all ingested document sources with their cryptographic hashes and taint states.
  - **Called By**: API routes and pipeline.

- **File**: `app/provenance/taint_tracker.py`
  - **Purpose**: Evaluates document trust and propagates taint tags across pipeline stages.
  - **Called By**: Injection detector, planner, firewall.

- **File**: `app/provenance/evidence_graph.py`
  - **Purpose**: Constructs a Directed Acyclic Graph (DAG) linking Intent, Source, Injection, Taint, Vendor Check, Action Plan, Firewall Verdict, and Recovery.
  - **Output**: `EvidenceGraph` (nodes + causal edges).

---

### Agent & Business Layer
- **File**: `app/agent/intent_contract.py`
  - **Purpose**: Generates immutable User Intent Contracts locking authorized tool actions.
  - **Called By**: Pipeline and `/intent/contract`.

- **File**: `app/agent/planner.py`
  - **Purpose**: Agent planning logic synthesizing proposed tool actions based on document content and user intent.
  - **Output**: `AgentPlan` (ordered list of `PlanStep` with taint metadata).

- **File**: `app/business/vendor_registry.py`
  - **Purpose**: Approved Vendor Master Registry storing verified vendor IDs, aliases, and whitelisted bank accounts.

- **File**: `app/business/vendor_verification.py`
  - **Purpose**: Compares invoice beneficiary accounts against the approved Vendor Master.
  - **Output**: `BusinessVerificationResult` (`MATCH` | `MISMATCH` | `UNKNOWN_VENDOR`).

---

### Database & Mock Tools & Recovery
- **File**: `app/database/audit_logger.py`
  - **Purpose**: Immutable logging of all security decisions with UUID event IDs and timestamps.
  - **Called By**: Action Firewall on every decision.

- **File**: `app/tools/mock_tools.py`
  - **Purpose**: Safe simulated mock tools (`read_invoice`, `prepare_payment_draft`, `change_beneficiary`, `send_external_email`, `execute_database_command`). Strictly blocks execution unless authorized by Action Firewall token.

- **File**: `app/recovery/recovery_engine.py`
  - **Purpose**: Recommends deterministic safe operational next steps when actions are blocked.

---

### Evaluation Benchmark
- **Files in `app/evaluation/`**:
  - `scenario_models.py`: Defines 25 synthetic benchmark scenarios (20 malicious, 5 benign).
  - `metrics.py`: Calculates ASR (Attack Success Rate), MBR (Malicious Block Rate), FPR (False Positive Rate), Intent-Violation Catch Rate, and Latency.
  - `attack_runner.py`: Executes single scenarios through the Action Firewall.
  - `evaluator.py`: Runs full batch evaluation.
  - `report_generator.py`: Generates structured JSON and Markdown evaluation reports.

---

## 4. Frontend File Map (React + Vite)

### Pages (`frontend/src/pages/`)
- **`Dashboard.jsx`**: High-level SOC overview displaying system metrics, recent security decisions, pipeline topology, and active defense stats.
- **`LiveSecurity.jsx`**: Primary jury demo console featuring 5 preset scenarios, 7-stage live pipeline flow, Decision Hero, and expandable evidence DAG.
- **`UniversalScanner.jsx`**: Universal Content Scanner supporting Drag & Drop upload across 10 formats with real-time metadata, text viewer, and Action Firewall analysis.
- **`AttackPlayground.jsx`**: Interactive testing console for all 25 adversarial benchmark scenarios with expected vs. actual decision verification.
- **`Evaluation.jsx`**: Benchmark dashboard displaying full evaluation metrics (ASR: 0.0%, MBR: 100.0%, FPR: 0.0%) and benchmark disclosures.
- **`VendorTrust.jsx`**: Approved vendor master registry table with alias matching and beneficiary verification policies.
- **`AuditTrail.jsx`**: Tamper-evident security timeline with click-to-expand forensic event inspection.
- **`Architecture.jsx`**: Interactive architecture visualization and component isolation diagrams.

### Components & Services
- **`Topbar.jsx`**: Real-time backend connectivity status (`CONNECTED` / `DISCONNECTED`), latency indicator, and `Reset Demo` button.
- **`Sidebar.jsx`**: Navigation sidebar linking all 8 console pages.
- **`AuditTimeline.jsx`**: Chronological event list with deep forensic metadata viewer.
- **`VendorTable.jsx`**: Approved vendor registry table with status badges and bank accounts.
- **`services/api.js`**: Centralized API client with automatic multi-port discovery (`8000`, `8001`, `8002`, `8003`) and multipart form-data upload support.

---

## 5. Quick-Reference Table

| If You Want to Inspect... | Go to This File |
| :--- | :--- |
| **Action Firewall Logic & Rules** | `app/security/action_firewall.py` |
| **Prompt Injection Heuristics & Decoders** | `app/security/injection_detector.py` |
| **User Intent Contract Boundary** | `app/agent/intent_contract.py` |
| **Agent Planning & Taint Assignment** | `app/agent/planner.py` |
| **Taint Tracking Engine** | `app/provenance/taint_tracker.py` |
| **Source Provenance Registry** | `app/provenance/source_registry.py` |
| **Causal Evidence Graph DAG** | `app/provenance/evidence_graph.py` |
| **Vendor & Beneficiary Verification** | `app/business/vendor_verification.py` |
| **Approved Vendor Master Database** | `app/business/vendor_registry.py` |
| **Multi-Format Document Extractors** | `app/ingestion/extractors/` |
| **Universal Content Upload API** | `app/api/routes.py` |
| **Safe Mock Execution Tools** | `app/tools/mock_tools.py` |
| **Safe Recovery Engine** | `app/recovery/recovery_engine.py` |
| **Immutable Audit Logging** | `app/database/audit_logger.py` |
| **25 Benchmark Scenarios** | `app/evaluation/scenario_models.py` |
| **Evaluation Metrics Engine** | `app/evaluation/metrics.py` |
| **React Frontend Entry** | `frontend/src/App.jsx` |
| **Frontend API Client** | `frontend/src/services/api.js` |
| **Automated Tests** | `tests/` |
