# FieldSync IEEE Project Report (LaTeX)

This directory contains the ready-to-compile, publication-grade **3-page IEEE format project report** for the **FieldSync** offline productivity, collaborative CRDT, and synchronization engine.

---

## 📄 Document Information

- **Title**: *FieldSync: An Offline-First Collaborative Field Inspection PWA and TWA with End-to-End Enterprise Role Workflows, CRDT Convergence, and Resumable Media*
- **Problem Statement**: WA-1 (Offline-First Collaborative Field Inspection App)
- **Format**: IEEE Conference Format (`\documentclass[conference]{IEEEtran}`)
- **Length**: **Exactly 3 Pages** (Double Column, 10pt)
- **Output Artifact**: [`main.pdf`](file:///c:/Users/tharu/Downloads/erodde/latex/main.pdf) (Vector-sharp graphics, 3 pages)
- **Diagrams**: Vector-sharp architectural and sequence flow diagrams rendered directly into the PDF using LaTeX TikZ.

---

## 📂 Folder Contents

| File / Folder | Purpose |
| :--- | :--- |
| [`main.tex`](file:///c:/Users/tharu/Downloads/erodde/latex/main.tex) | Main LaTeX source containing all technical sections, 12 inspection workspaces, mathematical formulations, benchmarking tables, and **native vector diagrams** (Fig 1: Architecture, Fig 2: Sequence flow). |
| [`main.pdf`](file:///c:/Users/tharu/Downloads/erodde/latex/main.pdf) | Pre-compiled 3-page camera-ready PDF document ready for submission, printing, or evaluation. |
| [`references.bib`](file:///c:/Users/tharu/Downloads/erodde/latex/references.bib) | BibTeX bibliography containing canonical citations (CRDTs, Local-First, W3C Specs, Dexie, Yjs, TWA, Cryptography). |
| [`IEEEtran.cls`](file:///c:/Users/tharu/Downloads/erodde/latex/IEEEtran.cls) | Official IEEEtran LaTeX class file (v1.8b). Self-contained — no external LaTeX distribution downloads required. |
| [`IEEEtran.bst`](file:///c:/Users/tharu/Downloads/erodde/latex/IEEEtran.bst) | Official IEEEtran BibTeX style file. |

---

## 🛠️ How to Compile

### Option 1: Local Terminal (MiKTeX / TeX Live / MacTeX)
Run the compilation sequence in this directory:
```bash
# 1. Initial pass
pdflatex -interaction=batchmode main.tex

# 2. Process bibliography
bibtex main

# 3. Resolve cross-references
pdflatex -interaction=batchmode main.tex

# 4. Final generation
pdflatex -interaction=batchmode main.tex
```

Or using `latexmk`:
```bash
latexmk -pdf main.tex
```

### Option 2: Overleaf (Cloud)
1. Compress the contents of this `latex/` folder into a `.zip` archive.
2. Go to [Overleaf](https://www.overleaf.com/) $\rightarrow$ **New Project** $\rightarrow$ **Upload Project**.
3. Set Compiler to **pdfLaTeX** and Main document to **`main.tex`**.
4. Click **Recompile**. All TikZ vector graphics compile immediately in the cloud without extra setup.

---

## 📊 Summary of Paper Sections & Visual Diagrams

1. **Section I: Introduction & Problem Formulation**: The zero-connectivity challenge in industrial inspections, failure modes of cloud-dependent SPAs, and local-first design tenets.
2. **Section II: System Architecture & 12 Inspection Subsystems**: Dexie Schema Version 3 stores, 12 inspection workspaces (Overview, Checklist, Measurements, Before/After, Signatures, Invoices, Equipment History, SLA, Notes, Voice Notes, Evidence, Audit Log), and non-destructive sequential migration pipeline ($v_1 \rightarrow v_2 \rightarrow v_3$).
   - **Figure 1 (Visual Vector Diagram)**: Complete graphical blueprint illustrating the Client PWA/TWA layer, Local IndexedDB Tier, Yjs CRDT engine, Background Sync Controller, and Cloud Ingestion Gateway.
3. **Section III: Synchronization Protocol, CRDTs & Conflict Adjudication**: Monotonic operations replay queue, dynamic cloud table cache recovery, Yjs binary delta vector convergence ($S_{local}^{(t+1)} = S_{local}^{(t)} \bullet \Delta_{mutation}$), and visual Conflict Center.
   - **Figure 2 (Visual Sequence Diagram)**: Complete graphical interaction flow between Customer, Admin, Technician, Supervisor, and Database across disconnected field execution and reconnection phases.
4. **Section IV: Resumable Media, Assistive Tools & TWA Packaging**: Chunked byte-range upload with offset persistence, on-device audio recording via `MediaRecorder`, zero-network multilingual engine (6 languages), W3C TTS speech synthesis, and Google Play Store Android TWA packaging.
5. **Section V: Evaluation & Verification**: 21/21 passing automated tests across customer workflows, local DB, offline productivity, and sync suites, plus production builds on Vercel and Cloudflare.
6. **Section VI: Conclusion**: Summary of contributions and industrial offline-first reliability.
