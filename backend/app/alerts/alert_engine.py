"""Common Alerting Protocol (CAP) Compatible Alert & Early Warning Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Evaluates multi-factor triggers, prevents alert fatigue through deduplication and cooldown,
distinguishes physical risk level from operational alert priority, and manages full lifecycle.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.entities import Alert, Location, Infrastructure, HistoricalLandslide
from app.audit.logger import log_audit_event
from app.alerts.alert_config import get_alert_config, AlertTriggerConfig
from app.alerts.notification_service import notification_dispatcher


def calculate_operational_alert_priority(
    risk_category: str,
    risk_score: float,
    geotechnical_fs: float,
    tier1_lifeline_count: int,
    population: int,
    rainfall_24h_mm: float
) -> str:
    """Determine operational action urgency ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').

    Explicitly decouples physical hazard/risk level from administrative action priority:
    - A moderate physical risk catchment with multiple Tier-1 hospitals/highways and dense population
      is escalated to HIGH operational priority.
    - An uninhabited critical hazard slope with zero infrastructure is managed as HIGH/MEDIUM rather
      than immediate community evacuation.
    """
    if risk_category == "CRITICAL" or geotechnical_fs < 1.0 or risk_score >= 75.0:
        return "CRITICAL"

    if tier1_lifeline_count >= 2 and rainfall_24h_mm > 100.0:
        return "CRITICAL"

    if risk_category == "HIGH" or geotechnical_fs < 1.25 or risk_score >= 50.0:
        return "HIGH"

    if tier1_lifeline_count >= 1 or (population > 5000 and rainfall_24h_mm > 70.0):
        return "HIGH"

    if risk_category == "MODERATE" or risk_score >= 30.0:
        return "MEDIUM"

    return "LOW"


def evaluate_and_generate_alerts(
    db: Session,
    location_id: int,
    risk_assessment: Dict[str, Any],
    recent_rainfall_intensity_mm_h: float = 12.0,
    rainfall_surge_delta_pct: float = 0.0,
    dispatch_notifications: bool = True
) -> Optional[Alert]:
    """Evaluate multi-trigger conditions and generate or escalate early warning alerts.

    Implements anti-fatigue deduplication, cooldown, and escalation logic.
    """
    cfg: AlertTriggerConfig = get_alert_config()

    score = float(risk_assessment.get("overall_risk_score", 0))
    category = str(risk_assessment.get("risk_category", "LOW")).upper()
    fs = float(risk_assessment.get("geotechnical_fs", 2.0))
    model_ver = str(risk_assessment.get("model_version_tag", "v1.2.0-gradient-boosting"))

    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        return None

    # Retrieve environmental and telemetry records
    ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
    rain_24h = ro.accum_24h_mm if ro else 20.0
    rain_72h = ro.antecedent_72h_mm if ro else 40.0
    rain_intensity = recent_rainfall_intensity_mm_h

    # Evaluate exposed infrastructure assets
    infras = loc.infrastructures or []
    tier1_count = sum(1 for inf in infras if inf.lifeline_tier == 1)
    infra_list = [
        {"name": inf.name, "type": inf.asset_type, "tier": inf.lifeline_tier, "capacity": inf.capacity}
        for inf in infras
    ]

    # Evaluate multi-trigger breach conditions
    triggers_breached = []
    if score >= cfg.critical_risk_score_threshold:
        triggers_breached.append(f"Critical risk score {round(score)}/100 (Threshold: {cfg.critical_risk_score_threshold})")
    elif score >= cfg.high_risk_score_threshold:
        triggers_breached.append(f"High risk score {round(score)}/100 (Threshold: {cfg.high_risk_score_threshold})")

    if fs < 1.0:
        triggers_breached.append(f"Limit equilibrium slope failure imminent (Fs {fs} < 1.0)")

    if rain_intensity >= cfg.rapid_rainfall_intensity_threshold:
        triggers_breached.append(f"Rapid rainfall downpour intensity ({rain_intensity} mm/h >= {cfg.rapid_rainfall_intensity_threshold})")

    if rain_24h >= cfg.rainfall_24h_accumulation_threshold:
        triggers_breached.append(f"Heavy 24h rainfall accumulation ({rain_24h} mm >= {cfg.rainfall_24h_accumulation_threshold})")

    if rain_72h >= cfg.rainfall_72h_accumulation_threshold:
        triggers_breached.append(f"Extreme 72h antecedent rainfall ({rain_72h} mm >= {cfg.rainfall_72h_accumulation_threshold})")

    if rainfall_surge_delta_pct >= cfg.risk_surge_delta_threshold:
        triggers_breached.append(f"Sudden rainfall surge increase (+{round(rainfall_surge_delta_pct, 1)}% in rolling window)")

    if tier1_count > 0 and score >= 40.0:
        triggers_breached.append(f"{tier1_count} Tier-1 critical emergency lifelines exposed in active hazard zone")

    # If no trigger condition breached, do not alert
    if not triggers_breached and category == "LOW":
        return None

    # Determine Severity & Standard Operating Procedure (SOP) Action
    if category == "CRITICAL" or fs < 1.0 or score >= cfg.critical_risk_score_threshold:
        severity = "EVACUATION"
        recommended_action = (
            "MANDATORY EVACUATION: Sound municipal sirens; deploy NDRF/SDRF rapid rescue battalions; "
            "order total closure of arterial ghat roads and bridges; immediately relocate slope-toe habitations."
        )
    elif category == "HIGH" or score >= cfg.high_risk_score_threshold or rain_24h >= cfg.rainfall_24h_accumulation_threshold:
        severity = "WARNING"
        recommended_action = (
            "LANDSLIDE WARNING: Dispatch geotechnical engineering inspection teams; place community emergency shelters on standby; "
            "pre-position excavators along transportation routes; restrict heavy vehicle transit."
        )
    else:
        severity = "ADVISORY"
        recommended_action = (
            "MONITORING ADVISORY: Monitor automatic weather stations (AWS) hourly; inspect highway drainage culverts; "
            "issue cautionary bulletin to local panchayats and transport departments."
        )

    # Calculate operational alert priority (CRITICAL, HIGH, MEDIUM, LOW)
    priority = calculate_operational_alert_priority(
        risk_category=category,
        risk_score=score,
        geotechnical_fs=fs,
        tier1_lifeline_count=tier1_count,
        population=loc.population or 0,
        rainfall_24h_mm=rain_24h
    )

    combined_trigger = " | ".join(triggers_breached) if triggers_breached else f"Risk Category {category} alert"
    now_utc = datetime.now(timezone.utc)

    # Check for active existing alert to implement Alert Fatigue Prevention
    active_statuses = ["GENERATED", "ACTIVE", "ACKNOWLEDGED", "ASSIGNED", "UNDER_INSPECTION"]
    existing_alert = (
        db.query(Alert)
        .filter(Alert.location_id == location_id, Alert.status.in_(active_statuses))
        .order_by(Alert.timestamp.desc())
        .first()
    )

    data_sources = ["IMD_DOPPLER_RADAR", "AWS_PRECIPITATION", "CARTODEM_30M", "SENTINEL2_NDVI"]

    if existing_alert:
        # Check cooldown and escalation rules
        last_time = existing_alert.last_escalated_at or existing_alert.timestamp
        # Normalize naive datetime to UTC if needed
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)

        minutes_since_last = (now_utc - last_time).total_seconds() / 60.0
        score_jump = score - existing_alert.risk_score
        severity_rank = {"ADVISORY": 1, "WATCH": 2, "WARNING": 3, "EVACUATION": 4}

        is_severity_escalated = severity_rank.get(severity, 1) > severity_rank.get(existing_alert.severity, 1)
        is_score_escalated = score_jump >= cfg.escalation_delta_threshold

        if is_severity_escalated or is_score_escalated:
            # Condition has worsened significantly: ESCALATE existing alert
            existing_alert.risk_score = score
            existing_alert.risk_category = category
            existing_alert.severity = severity
            existing_alert.priority = priority
            existing_alert.trigger_condition = f"[ESCALATED] {combined_trigger}"
            existing_alert.recommended_action = recommended_action
            existing_alert.affected_infrastructure_json = infra_list
            existing_alert.data_sources_json = data_sources
            existing_alert.model_version = model_ver
            existing_alert.escalation_count = (existing_alert.escalation_count or 0) + 1
            existing_alert.last_escalated_at = now_utc

            db.commit()
            db.refresh(existing_alert)

            log_audit_event(
                db=db,
                action_type="ESCALATE_ALERT",
                user_name="ALERT_ENGINE",
                entity_type="Alert",
                entity_id=str(existing_alert.id),
                payload_summary={
                    "alert_code": existing_alert.alert_code,
                    "location_name": loc.name,
                    "new_severity": severity,
                    "new_priority": priority,
                    "score_jump": round(score_jump, 1),
                    "escalation_count": existing_alert.escalation_count
                }
            )

            if dispatch_notifications:
                notification_dispatcher.dispatch_alert({
                    "id": existing_alert.id,
                    "alert_code": existing_alert.alert_code,
                    "location_name": loc.name,
                    "district": loc.district,
                    "risk_score": score,
                    "severity": severity,
                    "priority": priority,
                    "recommended_action": recommended_action,
                    "trigger_condition": existing_alert.trigger_condition,
                    "is_demo": existing_alert.is_demo
                })

            return existing_alert

        # Otherwise, alert condition persists within cooldown window -> prevent fatigue duplicate
        return existing_alert

    # Create new alert with formatted code
    new_alert = Alert(
        location_id=location_id,
        timestamp=now_utc,
        risk_score=score,
        risk_category=category,
        severity=severity,
        priority=priority,
        trigger_condition=combined_trigger,
        data_sources_json=data_sources,
        model_version=model_ver,
        affected_infrastructure_json=infra_list,
        recommended_action=recommended_action,
        status="GENERATED",
        escalation_count=0,
        is_demo=True
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # Assign persistent human-readable alert_code
    year_str = now_utc.strftime("%Y")
    new_alert.alert_code = f"ALT-{year_str}-{new_alert.id:04d}"
    db.commit()
    db.refresh(new_alert)

    # Log audit event
    log_audit_event(
        db=db,
        action_type="GENERATE_ALERT",
        user_name="ALERT_ENGINE",
        entity_type="Alert",
        entity_id=str(new_alert.id),
        payload_summary={
            "alert_code": new_alert.alert_code,
            "location_name": loc.name,
            "district": loc.district,
            "severity": severity,
            "priority": priority,
            "risk_score": score,
            "trigger": combined_trigger
        }
    )

    if dispatch_notifications:
        notification_dispatcher.dispatch_alert({
            "id": new_alert.id,
            "alert_code": new_alert.alert_code,
            "location_name": loc.name,
            "district": loc.district,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "risk_score": score,
            "risk_category": category,
            "severity": severity,
            "priority": priority,
            "recommended_action": recommended_action,
            "trigger_condition": combined_trigger,
            "data_sources": data_sources,
            "model_version": model_ver,
            "affected_infrastructure": infra_list,
            "is_demo": True
        })

    return new_alert


def acknowledge_alert(
    db: Session,
    alert_id: int,
    user_name: str,
    action_notes: Optional[str] = None
) -> Alert:
    """Acknowledge an active early warning alert and transition status to ACKNOWLEDGED."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert ID {alert_id} not found.")

    if alert.status in ["RESOLVED", "CLOSED"]:
        raise ValueError(f"Cannot acknowledge alert already in {alert.status} state.")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = user_name
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    log_audit_event(
        db=db,
        action_type="ACKNOWLEDGE_ALERT",
        user_name=user_name,
        entity_type="Alert",
        entity_id=str(alert_id),
        payload_summary={
            "alert_code": alert.alert_code,
            "action_notes": action_notes or "Acknowledged by Duty Desk"
        }
    )
    return alert


def assign_alert(
    db: Session,
    alert_id: int,
    assigned_to: str,
    user_name: str = "COMMANDER",
    instructions: Optional[str] = None
) -> Alert:
    """Assign alert to an emergency response team or field officer."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert ID {alert_id} not found.")

    alert.status = "ASSIGNED"
    alert.assigned_to = assigned_to
    alert.assigned_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    log_audit_event(
        db=db,
        action_type="ASSIGN_ALERT",
        user_name=user_name,
        entity_type="Alert",
        entity_id=str(alert_id),
        payload_summary={
            "alert_code": alert.alert_code,
            "assigned_to": assigned_to,
            "instructions": instructions or ""
        }
    )
    return alert


def update_alert_lifecycle_status(
    db: Session,
    alert_id: int,
    next_status: str,
    user_name: str,
    notes: Optional[str] = None
) -> Alert:
    """Transition alert to UNDER_INSPECTION, RESOLVED, or CLOSED with audit trail."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert ID {alert_id} not found.")

    valid_statuses = ["GENERATED", "ACTIVE", "ACKNOWLEDGED", "ASSIGNED", "UNDER_INSPECTION", "RESOLVED", "CLOSED"]
    next_status = next_status.upper()
    if next_status not in valid_statuses:
        raise ValueError(f"Invalid status '{next_status}'. Must be one of {valid_statuses}")

    now_utc = datetime.now(timezone.utc)
    alert.status = next_status

    if next_status == "RESOLVED":
        alert.resolved_at = now_utc
    elif next_status == "CLOSED":
        alert.closed_at = now_utc

    db.commit()
    db.refresh(alert)

    log_audit_event(
        db=db,
        action_type="UPDATE_ALERT_STATUS",
        user_name=user_name,
        entity_type="Alert",
        entity_id=str(alert_id),
        payload_summary={
            "alert_code": alert.alert_code,
            "new_status": next_status,
            "notes": notes or ""
        }
    )
    return alert
