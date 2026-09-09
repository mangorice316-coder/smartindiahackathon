"""Multi-Factor Field Inspection Prioritization & Geotechnical Task Management Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Computes multi-factor priority scores incorporating physical risk, human exposure,
critical lifelines, recent rainfall trends, historical activity, risk deltas, and ground-truth uncertainty.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.config import settings
from app.models.entities import InspectionTask, Location, Infrastructure, HistoricalLandslide
from app.audit.logger import log_audit_event


def calculate_multi_factor_inspection_priority(
    risk_score: float,
    population: int,
    lifeline_tier: int,
    rainfall_24h_mm: float,
    historical_count: int,
    risk_delta_pct: float,
    data_confidence: float = 0.85
) -> Tuple[float, str, Dict[str, float]]:
    """Compute mathematical multi-factor inspection urgency score [0, 100] with transparent breakdown.

    Factors:
    - 1. Physical Risk Score (up to 30 pts): Non-linear failure hazard
    - 2. Human & Demographic Exposure (up to 20 pts): Vulnerable residents in path
    - 3. Critical Lifelines (up to 20 pts): Tier-1 hospitals, arterial routes, bridges
    - 4. Rainfall Accumulation Trend (up to 15 pts): Extreme precipitation trigger
    - 5. Historical Landslide Memory (up to 7 pts): Recurrent landslide terrain scars
    - 6. Risk Surge Delta (up to 5 pts): Rapidly escalating instability
    - 7. Ground-Truth Uncertainty (up to 3 pts): Lower data confidence demands field verification
    """
    # 1. Risk Component (0 - 30)
    norm_risk = max(0.0, min(100.0, risk_score)) / 100.0
    comp_risk = (norm_risk ** 1.25) * 30.0

    # 2. Population Component (0 - 20)
    comp_pop = min(20.0, (min(10000, population) / 10000.0) * 20.0)

    # 3. Lifeline Component (0 - 20)
    if lifeline_tier == 1:
        comp_infra = 20.0
    elif lifeline_tier == 2:
        comp_infra = 12.0
    elif lifeline_tier == 3:
        comp_infra = 6.0
    else:
        comp_infra = 2.0

    # 4. Rainfall Trend Component (0 - 15)
    comp_rain = min(15.0, (max(0.0, rainfall_24h_mm) / 150.0) * 15.0)

    # 5. Historical Activity Component (0 - 7)
    comp_hist = min(7.0, historical_count * 2.5)

    # 6. Risk Surge Delta Component (0 - 5)
    comp_delta = min(5.0, max(0.0, risk_delta_pct / 4.0)) if risk_delta_pct > 0 else 0.0

    # 7. Ground-Truth Uncertainty Calibration (0 - 3)
    comp_uncertainty = max(0.0, (1.0 - data_confidence) * 10.0 * 0.3)

    raw_total = comp_risk + comp_pop + comp_infra + comp_rain + comp_hist + comp_delta + comp_uncertainty
    final_score = round(min(100.0, raw_total), 1)

    # Urgency Tier Classification
    if final_score >= settings.URGENCY_P1_IMMEDIATE:
        tier = "P1_IMMEDIATE"
    elif final_score >= settings.URGENCY_P2_HIGH:
        tier = "P2_HIGH"
    elif final_score >= settings.URGENCY_P3_MEDIUM:
        tier = "P3_MEDIUM"
    else:
        tier = "P4_LOW"

    breakdown = {
        "physical_risk": round(comp_risk, 1),
        "demographic_exposure": round(comp_pop, 1),
        "critical_lifelines": round(comp_infra, 1),
        "rainfall_trend": round(comp_rain, 1),
        "historical_memory": round(comp_hist, 1),
        "risk_surge_delta": round(comp_delta, 1),
        "ground_truth_verification": round(comp_uncertainty, 1)
    }

    return final_score, tier, breakdown


def get_default_deadline(urgency_tier: str) -> datetime:
    """Calculate operational deadline based on deployment urgency tier."""
    now_utc = datetime.now(timezone.utc)
    if urgency_tier == "P1_IMMEDIATE":
        return now_utc + timedelta(hours=4)
    elif urgency_tier == "P2_HIGH":
        return now_utc + timedelta(hours=12)
    elif urgency_tier == "P3_MEDIUM":
        return now_utc + timedelta(hours=48)
    else:
        return now_utc + timedelta(days=7)


def generate_prioritized_inspections(db: Session) -> List[InspectionTask]:
    """Evaluate all monitored catchments and automatically generate or update prioritized tasks."""
    locations = db.query(Location).all()
    created_or_updated = []
    now_utc = datetime.now(timezone.utc)

    for loc in locations:
        ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
        rain_24h = ro.accum_24h_mm if ro else 35.0

        latest_ra = loc.risk_assessments[-1] if loc.risk_assessments else None
        risk_score = latest_ra.overall_risk_score if latest_ra else 45.0
        confidence = latest_ra.model_confidence if latest_ra else 0.85
        factors = latest_ra.explanation_json.get("top_factors", []) if latest_ra and latest_ra.explanation_json else []

        delta = 15.0 if risk_score > 70 else 5.0 if risk_score > 50 else -2.0
        hist_count = len(loc.historical_landslides or [])

        # If location has infrastructure, generate prioritized tasks per asset
        infras = loc.infrastructures or []
        target_assets = infras if infras else [None]

        for infra in target_assets:
            tier_num = infra.lifeline_tier if infra else 3
            infra_name = infra.name if infra else "Catchment Slope Corridor"

            priority_score, urgency_tier, breakdown = calculate_multi_factor_inspection_priority(
                risk_score=risk_score,
                population=loc.population or 0,
                lifeline_tier=tier_num,
                rainfall_24h_mm=rain_24h,
                historical_count=hist_count,
                risk_delta_pct=delta,
                data_confidence=confidence
            )

            rationale = (
                f"Multi-Factor Priority {priority_score}/100 ({urgency_tier}). "
                f"Target: {infra_name}. Zone Risk: {round(risk_score)}/100. "
                f"24h Precipitation: {rain_24h} mm. "
                f"Breakdown: Risk {breakdown['physical_risk']}pts, Lifeline {breakdown['critical_lifelines']}pts, Rain {breakdown['rainfall_trend']}pts."
            )

            deadline = get_default_deadline(urgency_tier)

            # Check if an existing open task exists for this location and asset
            existing_task = (
                db.query(InspectionTask)
                .filter(
                    InspectionTask.location_id == loc.id,
                    InspectionTask.infrastructure_id == (infra.id if infra else None),
                    InspectionTask.status.in_(["PENDING", "DISPATCHED"])
                )
                .first()
            )

            if existing_task:
                existing_task.priority_score = priority_score
                existing_task.urgency_tier = urgency_tier
                existing_task.risk_score = risk_score
                existing_task.rationale = rationale
                existing_task.priority_breakdown_json = breakdown
                existing_task.contributing_factors_json = factors
                existing_task.updated_at = now_utc
                created_or_updated.append(existing_task)
            else:
                new_task = InspectionTask(
                    location_id=loc.id,
                    infrastructure_id=infra.id if infra else None,
                    priority_score=priority_score,
                    urgency_tier=urgency_tier,
                    risk_score=risk_score,
                    assigned_team=f"Rapid Response Geotech Squad #{loc.id % 4 + 1}",
                    assigned_officer="Officer-in-Charge (DDMA)",
                    deadline=deadline,
                    status="PENDING",
                    rationale=rationale,
                    contributing_factors_json=factors,
                    affected_infrastructure_json=[{"name": infra.name, "type": infra.asset_type, "tier": infra.lifeline_tier}] if infra else [],
                    priority_breakdown_json=breakdown,
                    evidence_attachments_json=[],
                    created_at=now_utc,
                    updated_at=now_utc
                )
                db.add(new_task)
                db.commit()
                db.refresh(new_task)
                new_task.task_code = f"INSP-{now_utc.strftime('%Y')}-{new_task.id:04d}"
                db.commit()
                db.refresh(new_task)
                created_or_updated.append(new_task)

    db.commit()
    return created_or_updated


def create_inspection_task(
    db: Session,
    location_id: int,
    infrastructure_id: Optional[int] = None,
    reason: Optional[str] = None,
    assigned_officer: Optional[str] = None,
    assigned_team: Optional[str] = None,
    deadline_hours: Optional[int] = 12,
    notes: Optional[str] = None,
    user_name: str = "COMMANDER"
) -> InspectionTask:
    """Manually dispatch a field inspection task from a risk zone or alert."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise ValueError(f"Location ID {location_id} not found.")

    infra = db.query(Infrastructure).filter(Infrastructure.id == infrastructure_id).first() if infrastructure_id else None

    latest_ra = loc.risk_assessments[-1] if loc.risk_assessments else None
    risk_score = latest_ra.overall_risk_score if latest_ra else 50.0
    factors = latest_ra.explanation_json.get("top_factors", []) if latest_ra and latest_ra.explanation_json else []

    ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
    rain_24h = ro.accum_24h_mm if ro else 40.0

    priority_score, urgency_tier, breakdown = calculate_multi_factor_inspection_priority(
        risk_score=risk_score,
        population=loc.population or 0,
        lifeline_tier=infra.lifeline_tier if infra else 2,
        rainfall_24h_mm=rain_24h,
        historical_count=len(loc.historical_landslides or []),
        risk_delta_pct=10.0,
        data_confidence=latest_ra.model_confidence if latest_ra else 0.85
    )

    now_utc = datetime.now(timezone.utc)
    deadline = now_utc + timedelta(hours=deadline_hours or 12)

    rationale = reason or (
        f"Field deployment ordered by {user_name} for {loc.name}. "
        f"Zone Risk: {round(risk_score)}/100. Target: {infra.name if infra else 'Slope Segment'}."
    )

    task = InspectionTask(
        location_id=location_id,
        infrastructure_id=infrastructure_id,
        priority_score=priority_score,
        urgency_tier=urgency_tier,
        risk_score=risk_score,
        assigned_team=assigned_team or "Geotechnical Quick Response Unit",
        assigned_officer=assigned_officer or user_name,
        deadline=deadline,
        status="DISPATCHED",
        rationale=rationale,
        contributing_factors_json=factors,
        affected_infrastructure_json=[{"name": infra.name, "type": infra.asset_type, "tier": infra.lifeline_tier}] if infra else [],
        priority_breakdown_json=breakdown,
        evidence_attachments_json=[],
        field_notes=notes or "",
        created_at=now_utc,
        updated_at=now_utc
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    task.task_code = f"INSP-{now_utc.strftime('%Y')}-{task.id:04d}"
    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        action_type="CREATE_INSPECTION_TASK",
        user_name=user_name,
        entity_type="InspectionTask",
        entity_id=str(task.id),
        payload_summary={
            "task_code": task.task_code,
            "location_name": loc.name,
            "assigned_officer": task.assigned_officer,
            "urgency_tier": task.urgency_tier,
            "priority_score": task.priority_score
        }
    )
    return task


def attach_inspection_evidence(
    db: Session,
    task_id: int,
    inspector_name: str,
    crack_displacement_mm: Optional[float] = None,
    observed_creep_severity: Optional[str] = "MODERATE",
    seepage_observed: Optional[bool] = False,
    photo_reference_ids: Optional[List[str]] = None,
    evidence_notes: str = ""
) -> InspectionTask:
    """Record physical field findings and geotechnical evidence onto an inspection task."""
    task = db.query(InspectionTask).filter(InspectionTask.id == task_id).first()
    if not task:
        raise ValueError(f"Inspection Task ID {task_id} not found.")

    evidence_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "inspector_name": inspector_name,
        "crack_displacement_mm": crack_displacement_mm,
        "observed_creep_severity": observed_creep_severity,
        "seepage_observed": seepage_observed,
        "photo_reference_ids": photo_reference_ids or [],
        "notes": evidence_notes
    }

    current_evidence = list(task.evidence_attachments_json or [])
    current_evidence.append(evidence_entry)
    task.evidence_attachments_json = current_evidence
    task.status = "INSPECTED"
    task.updated_at = datetime.now(timezone.utc)

    # Append notes
    summary_note = f"\n[{datetime.now(timezone.utc).strftime('%d-%b %H:%M')}] {inspector_name}: {evidence_notes}"
    if crack_displacement_mm:
        summary_note += f" (Crack measurement: {crack_displacement_mm} mm)"
    task.field_notes = (task.field_notes or "") + summary_note

    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        action_type="ATTACH_INSPECTION_EVIDENCE",
        user_name=inspector_name,
        entity_type="InspectionTask",
        entity_id=str(task_id),
        payload_summary={
            "task_code": task.task_code,
            "crack_displacement_mm": crack_displacement_mm,
            "seepage_observed": seepage_observed
        }
    )
    return task
