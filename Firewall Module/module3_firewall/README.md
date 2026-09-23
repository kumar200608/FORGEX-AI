# Unified AI Security Firewall — Module 3

## Overview
**Module 3: Unified AI Security Firewall** is a lightweight, reusable runtime guard for tool-using AI agents. It addresses **AI-2: Indirect Prompt-Injection Firewall for Tool-Using Agents** by establishing data boundaries, taint tracking contracts, influence tracking, and deterministic authorization controls.

When an AI agent reads external content (PDFs, Emails, Web pages, or plain text), hidden malicious instructions embedded inside that content can attempt to hijack agent behavior (Indirect Prompt Injection). Module 3 intercepts untrusted content, tags it with a request-scoped taint identifier, tracks where that taint flows into agent reasoning context, and evaluates sensitivity before sensitive tool actions (e.g. sending emails or processing financial payments) can execute.

---

## Open-Source / Local Security Analyzers

All security analysis in Module 3 is performed strictly **locally** using open-source libraries:

- **Python**
- **FastAPI**
- **Pydantic**
- **yara-python** (Local malware/pattern matching, suspicious scripts & custom YARA rules)
- **ClamAV** (Optional local antivirus & malware signature scanner adapter)
- **oletools** (Office OLE/VBA macro & suspicious document structure detection)
- **pefile** (PE binary/executable structural analysis & suspicious API import detection)
- **pypdf** (Safe PDF metadata, embedded JavaScript, and /OpenAction trigger inspection)
- **dnspython** (Local DNS domain information checking)
- **BeautifulSoup4** (Local HTML DOM parsing, hidden element CSS detection, credential harvesting forms)
- **tldextract** (Local domain/subdomain parsing and structure analysis)

### Local Security Guarantees:
- **No API keys required.**
- **All security analysis is performed locally.**
- **External threat-intelligence APIs are not required.**
- **Zero cloud security services or paid APIs.**
- **Optional scanners gracefully degrade when unavailable.**

*Note: Not every listed library is required for every request. Analyzers are selectively dispatched based on input source type and file characteristics.*

---

## Core Architecture & Execution Flow

```
External PDF / Email / Web / Text
              ↓
  Phase 2: Security Analysis Engine
  ├─ Custom Analyzers (Text, PDF, Email, Web)
  ├─ YARA Analyzer (yara-python)
  ├─ ClamAV Analyzer (Optional Local Antivirus)
  ├─ Office Analyzer (oletools)
  ├─ PE Analyzer (pefile)
  ├─ PDF Security Analyzer (pypdf)
  └─ URL/DNS Analyzer (bs4, tldextract, dnspython)
              ↓
    Phase 3: Taint Tracking Engine (TAINT-001)
              ↓
  Phase 4: Agent Reasoning Context (Taint-aware context)
              ↓
       Tool Request
              ↓
  Phase 5: Action Sensitivity Analyzer (HIGH / MEDIUM / LOW)
              ↓
  Phase 5: Security Policy Engine (Deterministic Rules)
              ↓
   ┌──────────┼──────────┐
   ▼          ▼          ▼
 ALLOW     CONFIRM     BLOCK
   │          │          │
   ▼          ▼          ▼
Mock Exec   No Exec    No Exec
 (Safe)     (Halted)   (Halted)
```

---

## Key Security Principles

1. **Taint-Aware Provenance**: Untrusted external inputs are tagged with unique `TAINT-xxx` IDs that propagate through derived data to track origin throughout request evaluation.
2. **Deterministic Security Policy**: Baseline rules evaluate action risk sensitivity (`HIGH`, `MEDIUM`, `LOW`), taint status, and security findings. No external LLM calls are used for security authorization decisions.
3. **Low False-Positive Design**: Untrusted content attempting `LOW`-risk actions (e.g., `search`, `get_weather`) is **ALLOWED** (`ALLOW`), while sensitive actions (e.g., `send_email`, `make_payment`) are **BLOCKED** (`BLOCK`) or **CONFIRMED** (`CONFIRM`).
4. **Request-Scoped Isolation**: All state is held in memory and isolated per request. Request A's taint state never contaminates Request B.
5. **Zero Persistent Raw Content Storage**: `TaintRecord` and `AgentContextModel` store reference IDs, never raw sensitive payload text.
6. **Mock-Only Tool Execution**: Protected tools are never executed against real networks, databases, email servers, or payment gateways. Blocked/Confirmed actions return `executed: False` with `result: null`.
7. **Safe Static-Only Analysis**: Office macros, PDF JavaScript, and PE executables are analyzed statically without execution.

---

## API Endpoints

The FastAPI application (`app/main.py`) provides the following endpoints:

| Endpoint | Method | Input Payload | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | None | `{ "status": "ok", "module": "Unified AI Security Firewall", "phase": 6 }` | Health check endpoint. |
| `/analyze` | `POST` | `SecurityInput` | `AnalysisResponse` | Analyzes content, generates security findings, and assigns initial taint. |
| `/track-influence` | `POST` | `InfluenceTrackRequest` | `InfluenceRecord` | Tracks whether agent context containing taint IDs influenced a tool request. |
| `/firewall/check` | `POST` | `FirewallCheckRequest` | `FirewallExecutionResult` | Intercepts tool request, evaluates policy, and executes mock tool if ALLOWED. |
| `/firewall/evaluate` | `POST` | `FirewallEvaluationRequest` | `FirewallEvaluationResponse` | Runs full end-to-end evaluation pipeline. |

---

## Installation & Running

1. **Install Dependencies**:
   ```bash
   pip install -r module3_firewall/requirements.txt
   ```

2. **Run Tests**:
   ```bash
   python -m pytest module3_firewall/tests/ -v
   ```

3. **Start FastAPI Development Server**:
   ```bash
   uvicorn module3_firewall.app.main:app --reload --port 8000
   ```

---

## Limitations & Disclaimer

- **Proof-of-Concept Prototype**: This project is built for hackathon demonstration purposes.
- **Static Analysis Only**: Does not execute suspicious binaries, macros, or PDF scripts.
- **No Absolute Guarantees**: Does not claim 100% detection rate or zero false positives.
