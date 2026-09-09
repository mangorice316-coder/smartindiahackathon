"""Audit Logging Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Maintains an immutable ledger of operational and decision-support actions.
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.entities import AuditEvent
from app.auth.security import mask_sensitive_data


def log_audit_event(
    db: Session,
    action_type: str,
    user_name: str = "SYSTEM_OPERATOR",
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    client_ip: Optional[str] = None,
    payload_summary: Optional[Dict[str, Any]] = None
) -> AuditEvent:
    """Record an immutable, credential-scrubbed audit event in the database."""
    safe_payload = mask_sensitive_data(payload_summary or {})
    event = AuditEvent(
        timestamp=datetime.now(timezone.utc),
        user_name=user_name,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        client_ip=client_ip,
        payload_summary=safe_payload
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
