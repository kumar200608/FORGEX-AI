"""API Route controllers for TraceGuard AI (Phase 3)."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.agent.intent_contract import create_intent_contract
from app.agent.planner import get_planner
from app.business.vendor_registry import get_vendor_registry
from app.business.vendor_verification import get_vendor_verification_engine
from app.core.models import (
    AgentPlan,
    AuditEvent,
    BusinessVerificationResult,
    EvidenceGraph,
    FirewallEvaluation,
    InjectionDetectionResult,
    IntentContract,
    PipelineRunResult,
    PlanStep,
    PolicyDecision,
    RecoveryAction,
    SensitiveActionType,
    SourceRecord,
    TaintStatus,
    ToolExecutionResult,
    UniversalUploadResponse,
    VendorRecord,
)
from app.core.security import FileValidationError
from app.database.audit_logger import get_audit_logger
from app.ingestion.extractors import get_universal_extractor
from app.ingestion.invoice_parser import parse_invoice_bytes
from app.provenance.evidence_graph import EvidenceGraphBuilder
from app.provenance.source_registry import get_source_registry
from app.provenance.taint_tracker import get_taint_tracker
from app.recovery.recovery_engine import get_recovery_engine
from app.security.action_firewall import get_action_firewall
from app.security.explanation_engine import get_explanation_engine
from app.security.injection_detector import detect_prompt_injection
from app.tools.mock_tools import MockTools

router = APIRouter(prefix="", tags=["TraceGuard Core"])

source_registry = get_source_registry()
audit_logger = get_audit_logger()
taint_tracker = get_taint_tracker()
action_firewall = get_action_firewall()
planner = get_planner()
vendor_registry = get_vendor_registry()
vendor_verification = get_vendor_verification_engine()
explanation_engine = get_explanation_engine()
recovery_engine = get_recovery_engine()


# --- Request Schemas ---

class TextInvoiceRequest(BaseModel):
    filename: str = Field(default="invoice.txt", description="Simulated filename")
    content_text: str = Field(..., description="Plain text invoice contents")


class AnalyzeInvoiceRequest(BaseModel):
    source_id: str = Field(..., description="Registered source ID to analyze")


class VerifyVendorRequest(BaseModel):
    source_id: str = Field(..., description="Source ID of invoice")
    extracted_fields: Dict[str, Any] = Field(..., description="Extracted invoice fields")


class CreateIntentRequest(BaseModel):
    user_goal: str = Field(..., description="User stated objective")
    allowed_actions: Optional[List[str]] = Field(
        default=None,
        description="Explicitly permitted tool action names",
    )
    intent_template: str = Field(
        default="PAYMENT_RECOMMENDATION",
        description="Template: PAYMENT_RECOMMENDATION | INVOICE_INSPECTION_ONLY | FULL_PAYMENT_PROCESSING",
    )


class GeneratePlanRequest(BaseModel):
    intent_id: str = Field(..., description="Intent contract ID")
    source_id: str = Field(..., description="Source ID")


class AuthorizeActionRequest(BaseModel):
    intent_id: str = Field(..., description="Intent contract ID")
    source_id: str = Field(..., description="Source ID")
    step: PlanStep = Field(..., description="Plan step to evaluate")


class ExecuteToolRequest(BaseModel):
    tool_name: str = Field(..., description="Name of mock tool")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")
    firewall_evaluation: Optional[FirewallEvaluation] = Field(
        default=None,
        description="Firewall authorization token",
    )


class PipelineExecuteRequest(BaseModel):
    user_goal: str = Field(
        default="Read invoice and prepare payment recommendation.",
        description="User goal for the Intent Contract",
    )
    invoice_text: Optional[str] = Field(
        default=None,
        description="Inline invoice text content (if not uploading file)",
    )
    filename: str = Field(
        default="invoice.txt",
        description="Filename for the invoice",
    )


class UniversalPipelineRequest(BaseModel):
    source_id: Optional[str] = Field(default=None, description="Registered source ID to analyze")
    user_goal: str = Field(
        default="Read document and summarize contents.",
        description="User goal for the Intent Contract",
    )
    allowed_actions: Optional[List[str]] = Field(
        default=None,
        description="Explicitly authorized tool actions",
    )
    intent_template: str = Field(
        default="PAYMENT_RECOMMENDATION",
        description="Intent template",
    )
    raw_text: Optional[str] = Field(default=None, description="Inline text to analyze")
    filename: str = Field(default="document.txt", description="Filename for inline text")


# --- Universal Multi-Format Endpoints (Phase 8) ---

universal_extractor = get_universal_extractor()


@router.get(
    "/sources/supported-formats",
    response_model=List[str],
    summary="List All Supported File Formats",
    tags=["Universal Content Ingestion"],
)
async def list_supported_formats() -> List[str]:
    """Retrieve list of supported file extensions (e.g. .pdf, .docx, .eml, .csv, .json, .xml, .html, .png, etc.)."""
    return universal_extractor.get_supported_extensions()


@router.post(
    "/sources/upload",
    response_model=UniversalUploadResponse,
    summary="Universal Untrusted Content Upload & Ingestion",
    tags=["Universal Content Ingestion"],
)
async def upload_universal_file(
    file: UploadFile = File(...),
) -> UniversalUploadResponse:
    """
    Accept, validate, extract, and register any supported multi-format file.
    
    Supported: PDF, Plain Text (.txt, .md), DOCX, Email (.eml), CSV, JSON, XML, HTML, Images (PNG, JPG, WebP).
    Enforces size limits, path traversal defense, and automatic UNTRUSTED_EXTERNAL trust classification.
    """
    try:
        content = await file.read()
        source_record, extraction_result, upload_response = universal_extractor.process_upload(
            filename=file.filename or "uploaded_document.txt",
            content=content,
            save_to_disk=True,
        )
        
        # Run prompt injection detection on extracted text
        injection_result = detect_prompt_injection(source_record.raw_text)
        evaluated_taint = taint_tracker.evaluate_source_taint(source_record, injection_result)
        
        source_record = source_record.model_copy(update={"taint_status": evaluated_taint})
        upload_response = upload_response.model_copy(
            update={
                "taint_status": evaluated_taint,
                "injection_result": injection_result,
            }
        )
        
        source_registry.register_source(source_record)
        return upload_response
    except FileValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ingestion failure: {str(e)}")


@router.get(
    "/sources/{source_id}",
    response_model=SourceRecord,
    summary="Get Source Record by ID",
    tags=["Universal Content Ingestion"],
)
async def get_source_by_id(source_id: str) -> SourceRecord:
    """Retrieve an ingested source record, extracted text, and metadata by source_id."""
    source = source_registry.get_source(source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source '{source_id}' not found.")
    return source


@router.post(
    "/sources/{source_id}/analyze",
    response_model=InjectionDetectionResult,
    summary="Analyze Ingested Source for Prompt Injection",
    tags=["Universal Content Ingestion"],
)
async def analyze_source(source_id: str) -> InjectionDetectionResult:
    """Run prompt-injection detection on an already ingested generic source."""
    source = source_registry.get_source(source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source '{source_id}' not found.")

    detection = detect_prompt_injection(source.raw_text)
    new_taint = taint_tracker.evaluate_source_taint(source, detection)
    source_registry.update_taint_status(source.source_id, new_taint)
    return detection


@router.post(
    "/sources/analyze-pipeline",
    response_model=PipelineRunResult,
    summary="Execute Security Pipeline on Universal Source",
    tags=["Universal Content Ingestion"],
)
async def execute_universal_pipeline(req: UniversalPipelineRequest) -> PipelineRunResult:
    """
    Execute complete TraceGuard Action Firewall pipeline for any universal uploaded source or inline text:
    1. Source Ingestion / Retrieval
    2. Prompt Injection Scanning & Taint Propagation
    3. Business Vendor Verification (if invoice/payment fields present)
    4. Immutable User Intent Contract
    5. Agent Planning with Provenance Tagging
    6. Action Firewall Gating
    7. Gated Tool Execution
    8. Safe Recovery & Evidence Graph Synthesis
    """
    # 1. Resolve source
    source: Optional[SourceRecord] = None
    if req.source_id:
        source = source_registry.get_source(req.source_id)
        if not source:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source '{req.source_id}' not found.")
    elif req.raw_text:
        content_bytes = req.raw_text.encode("utf-8")
        source, _, _ = universal_extractor.process_upload(
            filename=req.filename or "inline_document.txt",
            content=content_bytes,
            save_to_disk=False,
        )
        source_registry.register_source(source)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either 'source_id' or 'raw_text' must be provided.")

    # 2. Injection & Taint Analysis
    detection = detect_prompt_injection(source.raw_text)
    updated_taint = taint_tracker.evaluate_source_taint(source, detection)
    source = source.model_copy(update={"taint_status": updated_taint})
    source_registry.update_taint_status(source.source_id, updated_taint)

    # 3. Business Context Verification (if invoice fields or vendor present)
    bv = None
    if source.extracted_fields and any(k in source.extracted_fields for k in ["vendor", "beneficiary_account", "amount", "invoice_number"]):
        bv = vendor_verification.verify_invoice_business_context(
            source_id=source.source_id,
            extracted_fields=source.extracted_fields,
        )
    elif "vendor" in source.raw_text.lower() or "beneficiary" in source.raw_text.lower():
        # Fallback extract fields from raw text
        from app.ingestion.invoice_parser import extract_invoice_fields
        inline_fields = extract_invoice_fields(source.raw_text)
        if inline_fields:
            bv = vendor_verification.verify_invoice_business_context(
                source_id=source.source_id,
                extracted_fields=inline_fields,
            )

    # 4. Immutable Intent Contract
    intent = create_intent_contract(
        user_goal=req.user_goal,
        allowed_actions=req.allowed_actions,
        intent_template=req.intent_template,
    )

    # 5. Agent Planning
    plan = planner.generate_plan(intent=intent, source=source, injection_result=detection)

    # 6. Action Firewall Evaluation
    evaluations: List[FirewallEvaluation] = []
    tool_results: List[ToolExecutionResult] = []
    has_blocked = False

    for step in plan.steps:
        eval_result = action_firewall.evaluate_step(
            step=step,
            intent=intent,
            source_id=source.source_id,
            source_taint_status=updated_taint,
            business_verification=bv,
        )
        evaluations.append(eval_result)

        # 7. Gated Mock Tool Execution
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

    # 8. Safe Recovery Recommendation
    recovery = recovery_engine.determine_recovery_action(
        overall_decision=overall_decision,
        evaluations=evaluations,
        business_verification=bv,
    )

    # 9. Explanation Generation
    explanation = explanation_engine.generate_explanation(
        overall_decision=overall_decision,
        intent=intent,
        source=source,
        injection_result=detection,
        evaluations=evaluations,
        business_verification=bv,
    )

    # 10. Evidence Graph Synthesis
    evidence_graph = EvidenceGraphBuilder.build_evidence_graph(
        intent=intent,
        source=source,
        injection_result=detection,
        plan=plan,
        evaluations=evaluations,
        overall_decision=overall_decision,
        business_verification=bv,
        recovery=recovery,
    )

    return PipelineRunResult(
        source=source,
        injection_result=detection,
        intent=intent,
        plan=plan,
        business_verification=bv,
        evaluations=evaluations,
        tool_results=tool_results,
        overall_decision=overall_decision,
        explanation=explanation,
        recovery=recovery,
        evidence_graph=evidence_graph,
    )


# --- Legacy / Existing Ingestion Endpoints ---

@router.post(
    "/sources/invoice/text",
    response_model=SourceRecord,
    summary="Ingest Text Invoice",
)
async def ingest_text_invoice(req: TextInvoiceRequest) -> SourceRecord:
    """Ingest, validate, hash, and register a plain text invoice."""
    try:
        content_bytes = req.content_text.encode("utf-8")
        record = parse_invoice_bytes(
            filename=req.filename,
            content=content_bytes,
            save_to_upload_dir=True,
        )
        source_registry.register_source(record)
        return record
    except FileValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/sources/invoice/upload",
    response_model=SourceRecord,
    summary="Upload and Ingest Invoice File",
)
async def upload_invoice_file(file: UploadFile = File(...)) -> SourceRecord:
    """Upload and securely parse a PDF or TXT invoice."""
    try:
        content = await file.read()
        record = parse_invoice_bytes(
            filename=file.filename or "uploaded_invoice.pdf",
            content=content,
            save_to_upload_dir=True,
        )
        source_registry.register_source(record)
        return record
    except FileValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/analyze/invoice",
    response_model=InjectionDetectionResult,
    summary="Analyze Invoice for Prompt Injections",
)
async def analyze_invoice(req: AnalyzeInvoiceRequest) -> InjectionDetectionResult:
    """Run prompt-injection detection on an ingested document source."""
    source = source_registry.get_source(req.source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source '{req.source_id}' not found.")

    detection = detect_prompt_injection(source.raw_text)
    new_taint = taint_tracker.evaluate_source_taint(source, detection)
    source_registry.update_taint_status(source.source_id, new_taint)
    return detection


@router.get(
    "/business/vendors",
    response_model=List[VendorRecord],
    summary="List Approved Vendor Master Records",
)
async def list_approved_vendors() -> List[VendorRecord]:
    """Retrieve all approved vendors in the master registry."""
    return vendor_registry.list_vendors()


@router.post(
    "/business/verify",
    response_model=BusinessVerificationResult,
    summary="Verify Invoice Against Vendor Master",
)
async def verify_vendor_context(req: VerifyVendorRequest) -> BusinessVerificationResult:
    """Verify vendor existence, status, and beneficiary match."""
    return vendor_verification.verify_invoice_business_context(
        source_id=req.source_id,
        extracted_fields=req.extracted_fields,
    )


@router.post(
    "/intent/contract",
    response_model=IntentContract,
    summary="Create Immutable User Intent Contract",
)
async def create_intent(req: CreateIntentRequest) -> IntentContract:
    """Generate an immutable User Intent Contract."""
    return create_intent_contract(
        user_goal=req.user_goal,
        allowed_actions=req.allowed_actions,
        intent_template=req.intent_template,
    )


@router.post(
    "/agent/plan",
    response_model=AgentPlan,
    summary="Synthesize Agent Plan",
)
async def generate_agent_plan(req: GeneratePlanRequest) -> AgentPlan:
    """Generate a structured agent plan based on intent and document data."""
    source = source_registry.get_source(req.source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source '{req.source_id}' not found.")

    detection = detect_prompt_injection(source.raw_text)
    intent = create_intent_contract(user_goal="Read invoice and prepare payment recommendation.")
    return planner.generate_plan(intent=intent, source=source, injection_result=detection)


@router.post(
    "/action/authorize",
    response_model=FirewallEvaluation,
    summary="Authorize Plan Step through Action Firewall",
)
async def authorize_action(req: AuthorizeActionRequest) -> FirewallEvaluation:
    """Evaluate a proposed plan step through the deterministic Action Firewall."""
    source = source_registry.get_source(req.source_id)
    taint_status = source.taint_status if source else TaintStatus.UNTRUSTED
    intent = create_intent_contract(user_goal="Read invoice and prepare payment recommendation.")

    # Run business verification if source is available
    bv = None
    if source:
        bv = vendor_verification.verify_invoice_business_context(
            source_id=source.source_id,
            extracted_fields=source.extracted_fields,
        )

    return action_firewall.evaluate_step(
        step=req.step,
        intent=intent,
        source_id=req.source_id,
        source_taint_status=taint_status,
        business_verification=bv,
    )


@router.post(
    "/tool/execute",
    response_model=ToolExecutionResult,
    summary="Execute Gated Mock Tool",
)
async def execute_tool(req: ExecuteToolRequest) -> ToolExecutionResult:
    """Execute a mock tool strictly gated by the Action Firewall."""
    return MockTools.execute_tool(
        tool_name=req.tool_name,
        arguments=req.arguments,
        firewall_evaluation=req.firewall_evaluation,
    )


@router.post(
    "/pipeline/execute",
    response_model=PipelineRunResult,
    summary="Run Complete Phase 3 TraceGuard Pipeline",
)
async def execute_pipeline(req: PipelineExecuteRequest) -> PipelineRunResult:
    """
    Execute the entire TraceGuard Phase 3 pipeline:
    1. Ingestion & SHA-256 Hashing
    2. Prompt-Injection Heuristics & Taint Evaluation
    3. Business-Context & Vendor Master Verification
    4. Immutable Intent Contract
    5. Agent Planning
    6. Action Firewall Gating
    7. Gated Mock Tool Execution
    8. Explainable Evidence Graph & Narrative
    9. Safe Recovery Determination
    """
    invoice_text = req.invoice_text or (
        "Vendor: Global Supplies Corporation\n"
        "Invoice Number: INV-2026-8831\n"
        "Total Amount: $18,450.00\n"
        "Currency: USD\n"
        "Beneficiary Account: GBL-CORP-US-992144\n"
        "Due Date: 2026-10-18\n"
    )

    # 1. Ingest & Hash
    content_bytes = invoice_text.encode("utf-8")
    source = parse_invoice_bytes(
        filename=req.filename,
        content=content_bytes,
        save_to_upload_dir=False,
    )
    source_registry.register_source(source)

    # 2. Injection Analysis & Taint Evaluation
    detection = detect_prompt_injection(source.raw_text)
    updated_taint = taint_tracker.evaluate_source_taint(source, detection)
    source = source.model_copy(update={"taint_status": updated_taint})
    source_registry.update_taint_status(source.source_id, updated_taint)

    # 3. Business Context Verification
    bv = vendor_verification.verify_invoice_business_context(
        source_id=source.source_id,
        extracted_fields=source.extracted_fields,
    )

    # 4. Create Immutable Intent Contract
    intent = create_intent_contract(user_goal=req.user_goal)

    # 5. Agent Planning
    plan = planner.generate_plan(intent=intent, source=source, injection_result=detection)

    # 6. Action Firewall Evaluation per Step
    evaluations: List[FirewallEvaluation] = []
    tool_results: List[ToolExecutionResult] = []
    has_blocked = False

    for step in plan.steps:
        eval_result = action_firewall.evaluate_step(
            step=step,
            intent=intent,
            source_id=source.source_id,
            source_taint_status=updated_taint,
            business_verification=bv,
        )
        evaluations.append(eval_result)

        # 7. Gated Mock Tool Execution
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

    # 8. Safe Recovery Recommendation
    recovery = recovery_engine.determine_recovery_action(
        overall_decision=overall_decision,
        evaluations=evaluations,
        business_verification=bv,
    )

    # 9. Explanation Generation
    explanation = explanation_engine.generate_explanation(
        overall_decision=overall_decision,
        intent=intent,
        source=source,
        injection_result=detection,
        evaluations=evaluations,
        business_verification=bv,
    )

    # 10. Evidence Graph Synthesis
    evidence_graph = EvidenceGraphBuilder.build_evidence_graph(
        intent=intent,
        source=source,
        injection_result=detection,
        plan=plan,
        evaluations=evaluations,
        overall_decision=overall_decision,
        business_verification=bv,
        recovery=recovery,
    )

    return PipelineRunResult(
        source=source,
        injection_result=detection,
        intent=intent,
        plan=plan,
        business_verification=bv,
        evaluations=evaluations,
        tool_results=tool_results,
        overall_decision=overall_decision,
        explanation=explanation,
        recovery=recovery,
        evidence_graph=evidence_graph,
    )


@router.get(
    "/audit/{event_id}",
    response_model=AuditEvent,
    summary="Get Audit Event by ID",
)
async def get_audit_event(event_id: str) -> AuditEvent:
    """Retrieve an audit event by its unique ID."""
    event = audit_logger.get_event(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Audit event '{event_id}' not found.")
    return event


@router.get(
    "/audit",
    response_model=List[AuditEvent],
    summary="List Recent Audit Events",
)
async def list_audit_events(limit: int = 20) -> List[AuditEvent]:
    """List recent security decision audit events."""
    return audit_logger.list_events(limit=limit)


# --- Phase 4 Evaluation Endpoints ---

from app.evaluation.attack_runner import get_attack_runner
from app.evaluation.evaluation_models import FullEvaluationReport, ScenarioEvaluationResult
from app.evaluation.evaluator import get_batch_evaluator
from app.evaluation.report_generator import get_report_generator
from app.evaluation.scenario_models import EvaluationScenario, get_scenario_by_id, list_all_scenarios

evaluator = get_batch_evaluator()
attack_runner = get_attack_runner()
report_generator = get_report_generator()
_cached_report: Optional[FullEvaluationReport] = None


@router.get(
    "/evaluation/scenarios",
    response_model=List[EvaluationScenario],
    summary="List All Benchmark Scenarios",
    tags=["Security Evaluation"],
)
async def list_scenarios() -> List[EvaluationScenario]:
    """List all 10 synthetic benchmark scenarios."""
    return list_all_scenarios()


@router.post(
    "/evaluation/run",
    response_model=FullEvaluationReport,
    summary="Execute Full Benchmark Evaluation",
    tags=["Security Evaluation"],
)
async def run_full_evaluation() -> FullEvaluationReport:
    """Run all benchmark scenarios through the Action Firewall pipeline and compute metrics."""
    global _cached_report
    report = evaluator.run_full_evaluation()
    _cached_report = report
    report_generator.save_json_report(report)
    report_generator.save_markdown_report(report)
    return report


@router.post(
    "/evaluation/run/{scenario_id}",
    response_model=ScenarioEvaluationResult,
    summary="Execute Single Benchmark Scenario",
    tags=["Security Evaluation"],
)
async def run_single_scenario(scenario_id: str) -> ScenarioEvaluationResult:
    """Execute a specific scenario through the Action Firewall pipeline."""
    scenario = get_scenario_by_id(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found in benchmark registry.",
        )
    return attack_runner.run_scenario(scenario)


@router.get(
    "/evaluation/report",
    response_model=FullEvaluationReport,
    summary="Get Latest Evaluation Report",
    tags=["Security Evaluation"],
)
async def get_latest_evaluation_report() -> FullEvaluationReport:
    """Return the most recent evaluation report or generate a new one if not yet run."""
    global _cached_report
    if _cached_report is None:
        _cached_report = evaluator.run_full_evaluation()
        report_generator.save_json_report(_cached_report)
        report_generator.save_markdown_report(_cached_report)
    return _cached_report
