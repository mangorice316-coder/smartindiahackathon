"""Audit Ledger API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides tamper-evident visibility into all operational actions and simulations.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import AuditEvent, User
from app.models.schemas import AuditEventResponse
from app.auth.security import require_role

router = APIRouter(prefix="/audit", tags=["Audit Ledger & Traceability"])


@router.get("/events", response_model=List[AuditEventResponse])
def list_audit_events(
    action_type: Optional[str] = Query(None),
    user_name: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "ANALYST"))
):
    """Retrieve immutable operational audit events."""
    query = db.query(AuditEvent)
    if action_type:
        query = query.filter(AuditEvent.action_type == action_type)
    if user_name:
        query = query.filter(AuditEvent.user_name.ilike(f"%{user_name}%"))

    return query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
