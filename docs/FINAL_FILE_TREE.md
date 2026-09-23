# TraceGuard AI — Final Clean File Tree

This document outlines the final directory structure of TraceGuard AI with one-line descriptions for every component.

```text
TraceGuard-AI/
├── app/                                  # Core Python backend application (FastAPI)
│   ├── main.py                           # FastAPI application entrypoint & middleware
│   ├── agent/                            # Agent planning and intent boundaries
│   │   ├── intent_contract.py            # Immutable User Intent Contract model & factory
│   │   └── planner.py                    # Mock agent planner with provenance & taint tagging
│   ├── api/                              # REST API route controllers
│   │   └── routes.py                     # All FastAPI endpoints for pipeline, sources, audit, eval
│   ├── business/                         # Business context & registry verification
│   │   ├── vendor_registry.py            # Approved Vendor Master Registry & bank accounts
│   │   └── vendor_verification.py        # Beneficiary match / mismatch verification engine
│   ├── core/                             # Core configuration, security utilities, and models
│   │   ├── config.py                     # Pydantic settings & environment configuration
│   │   ├── models.py                     # Pydantic schemas, policy decisions, and enums
│   │   └── security.py                   # Path traversal defense, file validation, sanitization
│   ├── database/                         # Persistence & logging layer
│   │   └── audit_logger.py               # Tamper-evident immutable audit trail logger
│   ├── evaluation/                       # Synthetic benchmark evaluation suite (N=25)
│   │   ├── attack_runner.py              # Single scenario execution engine
│   │   ├── evaluation_models.py          # Benchmark reports, metrics schemas, confusion matrices
│   │   ├── evaluator.py                  # Batch evaluation suite runner
│   │   ├── metrics.py                    # ASR, MBR, FPR, Intent-Violation Catch Rate calculators
│   │   ├── report_generator.py           # JSON & Markdown benchmark report exporter
│   │   └── scenario_models.py            # 25 synthetic benchmark test scenario definitions
│   ├── ingestion/                        # Multi-format document ingestion & parsing
│   │   ├── invoice_parser.py             # Domain-specific regex invoice field extractor
│   │   └── extractors/                   # Sandboxed format extractors (10 formats)
│   │       ├── base.py                   # BaseExtractor abstract interface & schemas
│   │       ├── csv_parser.py             # CSV extractor with formula injection neutralization
│   │       ├── docx_parser.py            # Word DOCX extractor via python-docx
│   │       ├── email_parser.py           # RFC 822 Email (.eml) extractor
│   │       ├── html_parser.py            # HTML extractor with active script stripping
│   │       ├── image_ocr.py              # Image format validator and local OCR extractor
│   │       ├── json_parser.py            # JSON structured data extractor
│   │       ├── pdf_parser.py             # PDF text layer extractor via pypdf
│   │       ├── text_parser.py            # Plain text (.txt) and Markdown (.md) extractor
│   │       ├── xml_parser.py             # XML extractor with XXE entity protection
│   │       └── universal_extractor.py    # Master multi-format ingestion dispatcher
│   ├── provenance/                       # Provenance, taint tracking, and evidence DAG
│   │   ├── evidence_graph.py             # Causal Directed Acyclic Graph (DAG) builder
│   │   ├── source_registry.py            # In-memory document source registry
│   │   └── taint_tracker.py              # Provenance taint evaluator & propagation engine
│   ├── recovery/                         # Safe recovery recommendation engine
│   │   └── recovery_engine.py            # Deterministic safe next-step recommendation engine
│   ├── security/                         # Core security detection and firewall enforcement
│   │   ├── action_firewall.py            # Deterministic Action Firewall security boundary
│   │   ├── explanation_engine.py         # Human-readable and technical rationale generator
│   │   └── injection_detector.py         # Prompt injection heuristic scanner & decoders
│   └── tools/                            # Safe simulated tool execution
│       └── mock_tools.py                 # Firewall-gated mock tools (no real execution)
│
├── frontend/                             # React + Vite cybersecurity console frontend
│   ├── index.html                        # HTML5 document entrypoint
│   ├── package.json                      # Frontend dependencies & npm build scripts
│   ├── vite.config.js                    # Vite bundler configuration
│   └── src/
│       ├── App.jsx                       # Master React application component & router
│       ├── main.jsx                      # React 18 DOM mount entrypoint
│       ├── components/                   # Reusable UI widgets
│       │   ├── AuditTimeline.jsx         # Chronological security timeline with deep inspector
│       │   ├── Sidebar.jsx               # Left navigation bar with mode indicators
│       │   ├── Topbar.jsx                # Connectivity status, latency, and reset controls
│       │   └── VendorTable.jsx           # Vendor master registry table
│       ├── pages/                        # Primary console views
│       │   ├── Architecture.jsx          # System architecture and isolation diagrams
│       │   ├── AttackPlayground.jsx      # 25-scenario evaluation and playground runner
│       │   ├── AuditTrail.jsx            # Security event timeline and telemetry
│       │   ├── Dashboard.jsx             # High-level SOC metrics overview
│       │   ├── Evaluation.jsx            # Evaluation metrics and confusion matrix
│       │   ├── LiveSecurity.jsx          # Primary 5-scenario demo console
│       │   ├── UniversalScanner.jsx      # Drag & Drop 10-format content scanner
│       │   └── VendorTrust.jsx           # Approved vendor registry view
│       ├── services/
│       │   └── api.js                    # Dynamic multi-port discovering API client
│       └── styles/
│           └── index.css                 # Dark cybersecurity console design system
│
├── data/                                 # Demo fixtures and static data
│   ├── create_fixtures.py                # Fixture generation script
│   ├── demo_uploads/                     # 10 sample files for multi-format demonstrations
│   ├── emails/                           # Email sample fixtures
│   ├── invoices/                         # Invoice text and PDF fixtures
│   ├── rag_chunks/                       # Simulated RAG knowledge chunks
│   ├── vendors/                          # Vendor data fixtures
│   └── web_samples/                      # Web text sample fixtures
│
├── docs/                                 # Project documentation and reference maps
│   ├── PROJECT_MAP.md                    # Master architectural map & file dictionary
│   ├── JURY_QUICK_REFERENCE.md           # Jury Q&A cheat sheet
│   ├── FINAL_FILE_TREE.md                # Clean file tree with one-line descriptions
│   ├── CLEANUP_REPORT.md                 # Complete audit and cleanup report
│   └── archive/                          # Historical prototypes
│       └── frontend_legacy_streamlit/    # Original Streamlit prototype (preserved)
│
├── outputs/                              # Runtime logs, reports, and upload storage
│   ├── audit_logs/                       # Output audit event records
│   ├── evaluation_report.json            # Latest evaluation benchmark JSON
│   ├── evaluation_report.md              # Latest evaluation benchmark Markdown
│   └── uploads/                          # Sandboxed temporary upload directory
│
├── attacks/                              # Attack taxonomy and metadata (.gitkeep)
├── policies/                             # Security policy definitions (.gitkeep)
├── tests/                                # Automated test suite (137 tests passing)
│   ├── conftest.py                       # Pytest fixtures and test environment setup
│   ├── test_health.py                    # Health check tests
│   ├── test_models.py                    # Core model schema validation tests
│   ├── test_phase2_flow.py               # Injection and intent flow tests
│   ├── test_phase3_business.py           # Vendor verification & evidence graph tests
│   ├── test_phase4_evaluation.py         # Evaluation benchmark & metrics tests
│   ├── test_phase5_demo_scenarios.py     # Demo scenario integration tests
│   ├── test_phase5_security_hardening.py # Encoding, homoglyphs, and obfuscation tests
│   ├── test_phase5_security_regression.py# Security boundary and adversarial defense tests
│   ├── test_phase6_hardening.py          # 10-point Phase 6 security criteria tests
│   ├── test_phase8_universal_upload.py   # Multi-format extractors and upload API tests
│   └── test_security.py                  # Path traversal and filename sanitization tests
│
├── .env.example                          # Environment variable configuration template
├── .gitignore                            # Git file exclusion rules
├── README.md                             # Primary project README & hackathon guide
└── requirements.txt                      # Python backend dependencies
```
