"""Main FastAPI application entry point for TraceGuard AI."""

import logging
from datetime import datetime, timezone
import uuid
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router as api_router
from app.core.config import get_settings
from app.core.models import ErrorResponse, HealthResponse
from app.core.security import TraceGuardSecurityException

# Configure logging
settings = get_settings()
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("traceguard.api")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Explainable Action Firewall for AI Agents (FORGEX AI 2026 - AI-2)",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# Strict CORS Configuration with Localhost Regex Support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(TraceGuardSecurityException)
async def security_exception_handler(request: Request, exc: TraceGuardSecurityException):
    """Handle custom security exceptions without leaking internal system state."""
    req_id = str(uuid.uuid4())
    logger.warning("Security exception [req_id=%s]: %s", req_id, str(exc))
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            error="Security Validation Error",
            detail=str(exc),
            timestamp=datetime.now(timezone.utc),
            request_id=req_id,
        ).model_dump(mode="json"),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request schema validation errors cleanly."""
    req_id = str(uuid.uuid4())
    logger.info("Validation failure [req_id=%s]: %s", req_id, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="Invalid Request Schema",
            detail="The request body or parameters failed schema validation.",
            timestamp=datetime.now(timezone.utc),
            request_id=req_id,
        ).model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Fail-safe catch-all handler: Never leak internal stack traces to clients."""
    req_id = str(uuid.uuid4())
    logger.error("Unhandled error [req_id=%s]: %s", req_id, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Security Error",
            detail="An unexpected error occurred. The operation was safely aborted.",
            timestamp=datetime.now(timezone.utc),
            request_id=req_id,
        ).model_dump(mode="json"),
    )


# Include API Routes
app.include_router(api_router)


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["System"],
)
async def health_check() -> HealthResponse:
    """Check API operational status and return basic system metadata."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )


@app.get(
    "/",
    summary="Root Info",
    tags=["System"],
)
async def root_info():
    """Root endpoint providing core service identification."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "hackathon": "FORGEX AI 2026",
        "problem_statement": "AI-2 — Indirect Prompt-Injection Firewall for Tool-Using Agents",
        "team": "INNVOX",
        "status": "Phase 2 Pipeline Active",
    }
