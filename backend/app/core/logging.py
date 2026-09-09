"""Structured Logging & Observability.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides structured JSON/key-value logging for operational auditability.
"""
import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any, Dict


class StructuredJsonFormatter(logging.Formatter):
    """Format logs as structured JSON objects for ingestion by SIEM/ELK with sensitive data masking."""

    SENSITIVE_PATTERNS = {"password", "token", "secret", "authorization", "api_key", "credentials"}

    def _sanitize(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            return {
                k: "[REDACTED]" if any(s in k.lower() for s in self.SENSITIVE_PATTERNS) else self._sanitize(v)
                for k, v in obj.items()
            }
        elif isinstance(obj, list):
            return [self._sanitize(i) for i in obj]
        return obj

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno
        }
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "user"):
            log_entry["user"] = record.user
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_entry.update(self._sanitize(record.extra_data))
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure system-wide structured logger."""
    logger = logging.getLogger("landslide_system")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)

    return logger


logger = setup_logging()
