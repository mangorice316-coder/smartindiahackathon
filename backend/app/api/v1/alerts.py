"""Risk Alerts & Early Warning Siren Management API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides multi-trigger early warning generation, anti-fatigue deduplication,
full lifecycle state management, and OASIS Common Alerting Protocol (CAP) formatting.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import Alert, Location, User
from app.auth.security import require_role
from app.models.schemas import (
    AlertResponse,
    AlertAcknowledgeRequest,
    AlertAssignRequest,
    AlertStatusUpdateRequest,
    AlertTriggerConfigSchema
)
from app.alerts.alert_engine import (
    evaluate_and_generate_alerts,
    acknowledge_alert,
    assign_alert,
    update_alert_lifecycle_status
)
from app.alerts.alert_config import get_alert_config, update_alert_config
from app.alerts.notification_service import notification_dispatcher
from app.audit.logger import log_audit_event
from app.engine.risk_engine import assess_location_risk

router = APIRouter(prefix="/alerts", tags=["Emergency Alerts & Early Warnings"])


def _format_alert_response(a: Alert, loc: Optional[Location]) -> Dict[str, Any]:
    return {
        "id": a.id,
        "alert_code": a.alert_code or f"ALT-2026-{a.id:04d}",
        "location_id": a.location_id,
        "location_name": loc.name if loc else "Unknown",
        "district": loc.district if loc else "Unknown",
        "timestamp": a.timestamp,
        "risk_score": a.risk_score,
        "risk_category": a.risk_category or "HIGH",
        "severity": a.severity,
        "priority": a.priority or "HIGH",
        "trigger_condition": a.trigger_condition,
        "data_sources": a.data_sources_json or ["IMD_DOPPLER_RADAR", "AWS_PRECIPITATION"],
        "model_version": a.model_version or "v1.2.0-gradient-boosting",
        "affected_infrastructure": a.affected_infrastructure_json or [],
        "recommended_action": a.recommended_action,
        "status": a.status,
        "acknowledged_by": a.acknowledged_by,
        "acknowledged_at": a.acknowledged_at,
        "assigned_to": a.assigned_to,
        "assigned_at": a.assigned_at,
        "resolved_at": a.resolved_at,
        "escalation_count": a.escalation_count or 0,
        "is_demo": a.is_demo
    }


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status (GENERATED, ACTIVE, ACKNOWLEDGED, ASSIGNED, UNDER_INSPECTION, RESOLVED, CLOSED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (ADVISORY, WATCH, WARNING, EVACUATION)"),
    priority: Optional[str] = Query(None, description="Filter by operational priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    district: Optional[str] = Query(None, description="Filter by administrative district"),
    unacknowledged_only: bool = Query(False, description="Filter only unacknowledged active warnings"),
    db: Session = Depends(get_db)
):
    """Retrieve operational early warnings with multi-attribute filtering."""
    query = db.query(Alert)

    if status:
        query = query.filter(Alert.status == status.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if priority:
        query = query.filter(Alert.priority == priority.upper())
    if unacknowledged_only:
        query = query.filter(Alert.status.in_(["GENERATED", "ACTIVE"]))

    alerts = query.order_by(Alert.timestamp.desc()).all()
    results = []
    for a in alerts:
        loc = db.query(Location).filter(Location.id == a.location_id).first()
        if district and loc and district.lower() not in loc.district.lower():
            continue
        results.append(_format_alert_response(a, loc))
    return results


@router.get("/summary")
def get_alerts_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve authority executive summary metrics across alerts."""
    all_alerts = db.query(Alert).all()
    total = len(all_alerts)
    critical_count = sum(1 for a in all_alerts if a.priority == "CRITICAL" or a.severity == "EVACUATION")
    unack_count = sum(1 for a in all_alerts if a.status in ["GENERATED", "ACTIVE"])
    active_count = sum(1 for a in all_alerts if a.status in ["GENERATED", "ACTIVE", "ACKNOWLEDGED", "ASSIGNED", "UNDER_INSPECTION"])
    under_inspection_count = sum(1 for a in all_alerts if a.status == "UNDER_INSPECTION")
    resolved_count = sum(1 for a in all_alerts if a.status in ["RESOLVED", "CLOSED"])
    escalated_count = sum(1 for a in all_alerts if (a.escalation_count or 0) > 0)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_alerts": total,
        "active_alerts": active_count,
        "critical_priority_alerts": critical_count,
        "unacknowledged_alerts": unack_count,
        "under_inspection_alerts": under_inspection_count,
        "resolved_alerts": resolved_count,
        "escalated_alerts": escalated_count,
        "system_status": "OPERATIONAL_READY"
    }


@router.post("/evaluate")
def trigger_alert_evaluation(
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Evaluate environmental risk assessments and generate/escalate early warnings across all catchments."""
    locations = db.query(Location).all()
    generated_alerts = []

    for loc in locations:
        tf = loc.terrain_feature
        sf = loc.soil_feature
        ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
        eo = loc.environmental_observations[-1] if loc.environmental_observations else None
        lcf = loc.land_cover_feature
        infras = [{"name": inf.name, "asset_type": inf.asset_type, "lifeline_tier": inf.lifeline_tier} for inf in loc.infrastructures]

        if tf and sf and ro and eo and lcf:
            assessment = assess_location_risk(
                location_id=loc.id,
                location_name=loc.name,
                district=loc.district,
                terrain={"slope_degrees": tf.slope_degrees, "twi": tf.twi},
                soil={"cohesion_kpa": sf.cohesion_kpa, "friction_angle_deg": sf.friction_angle_deg, "soil_depth_m": sf.soil_depth_m, "bulk_density_kn_m3": sf.bulk_density_kn_m3},
                rainfall={"intensity_1h_mm": ro.intensity_1h_mm, "accum_24h_mm": ro.accum_24h_mm, "antecedent_72h_mm": ro.antecedent_72h_mm},
                environment={"soil_moisture_ratio": eo.soil_moisture_ratio},
                land_cover={"ndvi_index": lcf.ndvi_index, "road_cut_distance_m": lcf.road_cut_distance_m},
                infrastructures=infras,
                population=loc.population or 1000,
                historical_count=len(loc.historical_landslides)
            )
            alert = evaluate_and_generate_alerts(
                db=db,
                location_id=loc.id,
                risk_assessment=assessment,
                recent_rainfall_intensity_mm_h=ro.intensity_1h_mm,
                rainfall_surge_delta_pct=15.0 if ro.accum_24h_mm > 80 else 0.0
            )
            if alert:
                generated_alerts.append(alert.alert_code)

    return {
        "status": "EVALUATION_COMPLETE",
        "zones_evaluated": len(locations),
        "alerts_active_or_updated": len(generated_alerts),
        "alert_codes": generated_alerts
    }


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def handle_acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledgeRequest = Body(...),
    current_user: User = Depends(require_role("ADMIN", "ANALYST", "FIELD_OFFICER")),
    db: Session = Depends(get_db)
):
    """Acknowledge an active early warning with operator attribution."""
    ack_user = payload.acknowledged_by or current_user.username
    try:
        updated = acknowledge_alert(
            db=db,
            alert_id=alert_id,
            user_name=ack_user,
            action_notes=payload.action_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    loc = updated.location
    return _format_alert_response(updated, loc)


@router.post("/{alert_id}/assign", response_model=AlertResponse)
def handle_assign_alert(
    alert_id: int,
    payload: AlertAssignRequest = Body(...),
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
):
    """Assign alert to a field squad, rapid response team, or duty officer."""
    assigner = payload.assigned_by or current_user.username
    try:
        updated = assign_alert(
            db=db,
            alert_id=alert_id,
            assigned_to=payload.assigned_to,
            user_name=assigner,
            instructions=payload.instructions
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    loc = updated.location
    return _format_alert_response(updated, loc)


@router.post("/{alert_id}/status", response_model=AlertResponse)
def handle_update_alert_status(
    alert_id: int,
    payload: AlertStatusUpdateRequest = Body(...),
    current_user: User = Depends(require_role("ADMIN", "ANALYST", "FIELD_OFFICER")),
    db: Session = Depends(get_db)
):
    """Transition alert to UNDER_INSPECTION, RESOLVED, or CLOSED with audit record."""
    updater = payload.user_name or current_user.username
    try:
        updated = update_alert_lifecycle_status(
            db=db,
            alert_id=alert_id,
            next_status=payload.status,
            user_name=updater,
            notes=payload.resolution_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    loc = updated.location
    return _format_alert_response(updated, loc)


@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    user_name: Optional[str] = None,
    current_user: User = Depends(require_role("ADMIN", "ANALYST", "FIELD_OFFICER")),
    db: Session = Depends(get_db)
):
    """Resolve and archive an emergency alert."""
    resolver = user_name or current_user.username
    try:
        updated = update_alert_lifecycle_status(
            db=db,
            alert_id=alert_id,
            next_status="RESOLVED",
            user_name=resolver,
            notes="Alert resolved by incident commander or authorized officer."
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"status": "RESOLVED", "alert_id": alert_id, "alert_code": updated.alert_code}


@router.get("/{alert_id}/cap")
def get_alert_cap_payload(alert_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Export alert formatted according to OASIS Common Alerting Protocol (CAP v1.2) specification."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert ID {alert_id} not found.")

    loc = alert.location
    alert_dict = _format_alert_response(alert, loc)
    if loc:
        alert_dict["latitude"] = loc.latitude
        alert_dict["longitude"] = loc.longitude

    cap_channel = notification_dispatcher.channels.get("CAP")
    if not cap_channel:
        raise HTTPException(status_code=500, detail="CAP Channel not available.")

    return cap_channel.send_notification(alert_dict)


@router.get("/config", response_model=AlertTriggerConfigSchema)
def get_alert_trigger_thresholds():
    """Retrieve runtime configurable trigger thresholds."""
    cfg = get_alert_config()
    return cfg.to_dict()


@router.post("/config", response_model=AlertTriggerConfigSchema)
def update_alert_trigger_thresholds(
    payload: AlertTriggerConfigSchema = Body(...),
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Update runtime configurable trigger thresholds. Restricted to ADMIN role."""
    updated = update_alert_config(payload.model_dump())
    log_audit_event(
        db=db,
        action_type="UPDATE_ALERT_THRESHOLDS",
        user_name=current_user.username,
        payload_summary=updated.to_dict()
    )
    return updated.to_dict()
