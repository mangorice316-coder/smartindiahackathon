"""Field Inspection Prioritization & Geotechnical Task Dispatch API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Generates multi-factor inspection urgency rankings, manages field squads,
records physical crack/displacement evidence, and tracks lifecycle.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import InspectionTask, Location, User
from app.auth.security import require_role
from app.models.schemas import (
    InspectionTaskResponse,
    InspectionCreateRequest,
    InspectionUpdateRequest,
    InspectionEvidenceRequest
)
from app.inspections.prioritizer import (
    generate_prioritized_inspections,
    create_inspection_task,
    attach_inspection_evidence
)
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/inspections", tags=["Field Inspection Prioritization"])


def _format_inspection_response(t: InspectionTask, loc: Optional[Location]) -> Dict[str, Any]:
    infra = t.infrastructure
    return {
        "id": t.id,
        "task_code": t.task_code or f"INSP-2026-{t.id:04d}",
        "location_id": t.location_id,
        "location_name": loc.name if loc else "Unknown",
        "district": loc.district if loc else "Unknown",
        "infrastructure_id": t.infrastructure_id,
        "infrastructure_name": infra.name if infra else None,
        "priority_score": t.priority_score,
        "urgency_tier": t.urgency_tier,
        "risk_score": t.risk_score or 50.0,
        "assigned_team": t.assigned_team,
        "assigned_officer": t.assigned_officer,
        "deadline": t.deadline,
        "status": t.status,
        "rationale": t.rationale,
        "contributing_factors": t.contributing_factors_json or [],
        "affected_infrastructure": t.affected_infrastructure_json or [],
        "priority_breakdown": t.priority_breakdown_json,
        "evidence_attachments": t.evidence_attachments_json or [],
        "field_notes": t.field_notes,
        "created_at": t.created_at,
        "updated_at": t.updated_at
    }


@router.get("", response_model=List[InspectionTaskResponse])
def list_inspections(
    urgency_tier: Optional[str] = None,
    status: Optional[str] = None,
    location_id: Optional[int] = None,
    assigned_officer: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List prioritized geotechnical field inspection tasks ordered by priority score descending."""
    query = db.query(InspectionTask)

    if isinstance(urgency_tier, str) and urgency_tier.strip():
        query = query.filter(InspectionTask.urgency_tier == urgency_tier.upper().strip())
    if isinstance(status, str) and status.strip():
        query = query.filter(InspectionTask.status == status.upper().strip())
    if isinstance(location_id, int):
        query = query.filter(InspectionTask.location_id == location_id)
    if isinstance(assigned_officer, str) and assigned_officer.strip():
        query = query.filter(InspectionTask.assigned_officer.ilike(f"%{assigned_officer.strip()}%"))

    tasks = query.order_by(InspectionTask.priority_score.desc()).all()
    results = []
    for t in tasks:
        loc = db.query(Location).filter(Location.id == t.location_id).first()
        results.append(_format_inspection_response(t, loc))
    return results


@router.get("/{task_id}", response_model=InspectionTaskResponse)
def get_inspection_task_detail(task_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed inspection task data with attached evidence and factor breakdown."""
    task = db.query(InspectionTask).filter(InspectionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Inspection task ID {task_id} not found.")

    loc = task.location
    return _format_inspection_response(task, loc)


@router.post("", response_model=InspectionTaskResponse)
def handle_create_inspection(
    payload: InspectionCreateRequest = Body(...),
    user_name: Optional[str] = None,
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
):
    """Manually create and dispatch an inspection task for a high-risk catchment or alert."""
    creator = user_name or current_user.username
    try:
        task = create_inspection_task(
            db=db,
            location_id=payload.location_id,
            infrastructure_id=payload.infrastructure_id,
            reason=payload.reason,
            assigned_officer=payload.assigned_officer,
            assigned_team=payload.assigned_team,
            deadline_hours=payload.deadline_hours,
            notes=payload.notes,
            user_name=creator
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    loc = task.location
    return _format_inspection_response(task, loc)


@router.post("/prioritize", response_model=List[InspectionTaskResponse])
def trigger_prioritization(
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
):
    """Recalculate multi-factor inspection urgency across all catchments and update tasks."""
    tasks = generate_prioritized_inspections(db)
    log_audit_event(
        db=db,
        action_type="RECALCULATE_INSPECTION_PRIORITIES",
        user_name=current_user.username,
        payload_summary={"task_count": len(tasks)}
    )
    return list_inspections(db=db)


@router.patch("/{task_id}", response_model=InspectionTaskResponse)
def update_inspection_task(
    task_id: int,
    payload: InspectionUpdateRequest = Body(...),
    current_user: User = Depends(require_role("ADMIN", "ANALYST", "FIELD_OFFICER")),
    db: Session = Depends(get_db)
):
    """Update inspection status (e.g. DISPATCHED, INSPECTED, CLEARED, CLOSED) and officer notes."""
    task = db.query(InspectionTask).filter(InspectionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Inspection task not found.")

    if payload.status:
        task.status = payload.status.upper()
    if payload.assigned_team:
        task.assigned_team = payload.assigned_team
    if payload.assigned_officer:
        task.assigned_officer = payload.assigned_officer
    if payload.field_notes:
        task.field_notes = payload.field_notes
    task.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        action_type="UPDATE_INSPECTION_TASK",
        user_name=current_user.username,
        entity_type="InspectionTask",
        entity_id=str(task_id),
        payload_summary={"status": task.status, "notes": task.field_notes}
    )

    loc = task.location
    return _format_inspection_response(task, loc)


@router.post("/{task_id}/evidence", response_model=InspectionTaskResponse)
def handle_attach_evidence(
    task_id: int,
    payload: InspectionEvidenceRequest = Body(...),
    current_user: User = Depends(require_role("ADMIN", "FIELD_OFFICER")),
    db: Session = Depends(get_db)
):
    """Attach physical field geotechnical evidence (crack displacement, creep, seepage, photos)."""
    inspector = payload.inspector_name or current_user.username
    try:
        updated = attach_inspection_evidence(
            db=db,
            task_id=task_id,
            inspector_name=inspector,
            crack_displacement_mm=payload.crack_displacement_mm,
            observed_creep_severity=payload.observed_creep_severity,
            seepage_observed=payload.seepage_observed,
            photo_reference_ids=payload.photo_reference_ids,
            evidence_notes=payload.evidence_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    loc = updated.location
    return _format_inspection_response(updated, loc)
