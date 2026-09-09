"""Safe Logging & Secret Redaction Filter.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Ensures passwords, tokens, authorization headers, and API keys are never
leaked to standard output, application log files, or audit trails.
"""
import re
import logging
from typing import Any

# Sensitive pattern regexes (matches both quoted and unquoted credential pairs)
SECRET_PATTERNS = [
    (re.compile(r'(password["\']?\s*[:=]\s*["\']?)([^\s"\',&]+)(["\']?)', re.IGNORECASE), r'\1[REDACTED]\3'),
    (re.compile(r'(bearer\s+)([a-zA-Z0-9_\-\.]+)', re.IGNORECASE), r'\1[REDACTED_TOKEN]'),
    (re.compile(r'(token["\']?\s*[:=]\s*["\']?)([^\s"\',&]+)(["\']?)', re.IGNORECASE), r'\1[REDACTED]\3'),
    (re.compile(r'(secret["\']?\s*[:=]\s*["\']?)([^\s"\',&]+)(["\']?)', re.IGNORECASE), r'\1[REDACTED]\3'),
    (re.compile(r'(api_key["\']?\s*[:=]\s*["\']?)([^\s"\',&]+)(["\']?)', re.IGNORECASE), r'\1[REDACTED]\3'),
]


class SensitiveDataSanitizingFilter(logging.Filter):
    """Logging filter that scrubs sensitive credentials from log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            sanitized = record.msg
            for pattern, repl in SECRET_PATTERNS:
                sanitized = pattern.sub(repl, sanitized)
            record.msg = sanitized

        if record.args:
            if isinstance(record.args, dict):
                from app.auth.security import mask_sensitive_data
                record.args = mask_sensitive_data(record.args)
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    "[REDACTED]" if any(k in str(arg).lower() for k in ["pass", "token", "secret", "bearer"]) else arg
                    for arg in record.args
                )

        return True


def configure_safe_logging():
    """Apply sanitization filter to root and uvicorn loggers."""
    sanitizer = SensitiveDataSanitizingFilter()
    root_logger = logging.getLogger()
    root_logger.addFilter(sanitizer)

    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"]:
        log = logging.getLogger(logger_name)
        log.addFilter(sanitizer)
