"""Secure application configuration module for TraceGuard AI."""

from functools import lru_cache
from pathlib import Path
from typing import List, Set
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # General App Config
    APP_NAME: str = Field(default="TraceGuard AI", description="Application name")
    APP_VERSION: str = Field(default="0.1.0", description="Application version")
    ENVIRONMENT: str = Field(default="development", description="Environment: development | staging | production")
    DEBUG: bool = Field(default=False, description="Debug mode flag (disabled in production)")
    HOST: str = Field(default="127.0.0.1", description="Bind host")
    PORT: int = Field(default=8000, description="Bind port")

    # API Security & CORS
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:8003",
            "http://127.0.0.1:8003",
            "http://localhost:8501",
            "http://127.0.0.1:8501",
        ],
        description="Allowed CORS origins",
    )

    # File Handling & Upload Constraints
    MAX_UPLOAD_SIZE_BYTES: int = Field(
        default=5 * 1024 * 1024,  # 5 MB
        description="Maximum file upload size in bytes (Security By Design)",
    )
    ALLOWED_EXTENSIONS: Set[str] = Field(
        default={".txt", ".pdf", ".eml", ".json", ".csv", ".md"},
        description="Whitelisted file extensions for ingestion",
    )
    ALLOWED_MIME_TYPES: Set[str] = Field(
        default={
            "text/plain",
            "application/pdf",
            "message/rfc822",
            "application/json",
            "text/csv",
            "text/markdown",
        },
        description="Whitelisted MIME types for ingestion",
    )

    # Controlled Directories
    UPLOAD_DIR: Path = Field(
        default=Path("outputs/uploads"),
        description="Controlled directory for storing uploaded files safely",
    )
    AUDIT_LOG_DIR: Path = Field(
        default=Path("outputs/audit_logs"),
        description="Controlled directory for audit event logs",
    )

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")


@lru_cache()
def get_settings() -> Settings:
    """Return cached instance of application settings."""
    settings = Settings()
    # Ensure controlled output directories exist
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.AUDIT_LOG_DIR.mkdir(parents=True, exist_ok=True)
    return settings
