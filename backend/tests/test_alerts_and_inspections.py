"""Comprehensive Test Suite for Early Warning, Alert, and Field Inspection Prioritization.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Tests alert triggers, deduplication, cooldown, escalation, operational priorities,
full lifecycle state machine, inspection priority formula, evidence attachments, and CAP payloads.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from main import app
from app.database import SessionLocal
from app.models.entities import Location, Alert, InspectionTask, Infrastructure
from app.alerts.alert_engine import (
    evaluate_and_generate_alerts,
    calculate_operational_alert_priority,
    acknowledge_alert,
    assign_alert,
    update_alert_lifecycle_status
)
from app.alerts.alert_config import get_alert_config, update_alert_config
from app.inspections.prioritizer import (
    calculate_multi_factor_inspection_priority,
    create_inspection_task,
    attach_inspection_evidence
)
from app.alerts.notification_service import notification_dispatcher


from app.database import SessionLocal, init_db


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db():
    init_db()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_alert_operational_priority_vs_risk_level():
    """Verify explicit separation of physical risk category and operational alert priority."""
    # Scenario A: Moderate risk, but 2 Tier-1 emergency lifelines and heavy rain -> Escalates to CRITICAL operational priority
    prio_a = calculate_operational_alert_priority(
        risk_category="MODERATE",
        risk_score=42.0,
        geotechnical_fs=1.45,
        tier1_lifeline_count=2,
        population=8000,
        rainfall_24h_mm=120.0
    )
    assert prio_a == "CRITICAL"

    # Scenario B: High risk slope with single Tier-1 lifeline -> HIGH operational priority
    prio_b = calculate_operational_alert_priority(
        risk_category="HIGH",
        risk_score=65.0,
        geotechnical_fs=1.15,
        tier1_lifeline_count=1,
        population=3000,
        rainfall_24h_mm=45.0
    )
    assert prio_b == "HIGH"

    # Scenario C: Low physical risk without lifelines -> LOW operational priority
    prio_c = calculate_operational_alert_priority(
        risk_category="LOW",
        risk_score=18.0,
        geotechnical_fs=2.2,
        tier1_lifeline_count=0,
        population=500,
        rainfall_24h_mm=10.0
    )
    assert prio_c == "LOW"


def test_alert_generation_and_deduplication(db):
    """Verify alert generation, fatigue deduplication, and cooldown behavior."""
    loc = db.query(Location).first()
    assert loc is not None

    assessment_1 = {
        "overall_risk_score": 75.0,
        "risk_category": "CRITICAL",
        "geotechnical_fs": 0.92,
        "model_version_tag": "v1.2.0-gradient-boosting"
    }

    # 1. First evaluation: should generate a new alert
    alert_1 = evaluate_and_generate_alerts(
        db=db,
        location_id=loc.id,
        risk_assessment=assessment_1,
        recent_rainfall_intensity_mm_h=28.0,
        dispatch_notifications=False
    )
    assert alert_1 is not None
    assert alert_1.status == "GENERATED"
    assert alert_1.severity == "EVACUATION"
    assert alert_1.priority == "CRITICAL"
    assert alert_1.alert_code.startswith("ALT-")

    # 2. Immediate second evaluation with same score: should return existing alert (anti-fatigue deduplication)
    alert_2 = evaluate_and_generate_alerts(
        db=db,
        location_id=loc.id,
        risk_assessment=assessment_1,
        recent_rainfall_intensity_mm_h=28.0,
        dispatch_notifications=False
    )
    assert alert_2.id == alert_1.id
    assert alert_2.escalation_count == 0


def test_alert_escalation_on_worsened_conditions(db):
    """Verify that worsened conditions update and escalate the existing alert rather than duplicating."""
    loc = db.query(Location).first()
    assert loc is not None

    # Isolate test by removing any prior alerts for this location
    db.query(Alert).filter(Alert.location_id == loc.id).delete()
    db.commit()

    baseline_assessment = {
        "overall_risk_score": 55.0,
        "risk_category": "HIGH",
        "geotechnical_fs": 1.20,
        "model_version_tag": "v1.2.0-gradient-boosting"
    }

    alert = evaluate_and_generate_alerts(
        db=db,
        location_id=loc.id,
        risk_assessment=baseline_assessment,
        recent_rainfall_intensity_mm_h=15.0,
        dispatch_notifications=False
    )
    initial_score = alert.risk_score

    # Now worsen conditions: score jumps from 55 to 82 (+27 pts jump > escalation threshold)
    worsened_assessment = {
        "overall_risk_score": 82.0,
        "risk_category": "CRITICAL",
        "geotechnical_fs": 0.88,
        "model_version_tag": "v1.2.0-gradient-boosting"
    }

    escalated_alert = evaluate_and_generate_alerts(
        db=db,
        location_id=loc.id,
        risk_assessment=worsened_assessment,
        recent_rainfall_intensity_mm_h=35.0,
        dispatch_notifications=False
    )

    # Should update the same alert record
    assert escalated_alert.id == alert.id
    assert escalated_alert.risk_score == 82.0
    assert escalated_alert.severity == "EVACUATION"
    assert escalated_alert.escalation_count >= 1
    assert "[ESCALATED]" in escalated_alert.trigger_condition


def test_alert_lifecycle_state_transitions(db):
    """Verify full state machine: GENERATED -> ACKNOWLEDGED -> ASSIGNED -> UNDER_INSPECTION -> RESOLVED -> CLOSED."""
    loc = db.query(Location).first()

    assessment = {
        "overall_risk_score": 68.0,
        "risk_category": "HIGH",
        "geotechnical_fs": 1.15,
        "model_version_tag": "v1.2.0-gradient-boosting"
    }

    alert = evaluate_and_generate_alerts(
        db=db,
        location_id=loc.id,
        risk_assessment=assessment,
        dispatch_notifications=False
    )

    # 1. Acknowledge
    ack = acknowledge_alert(db, alert.id, user_name="Officer Ramesh", action_notes="Dispatched patrol")
    assert ack.status == "ACKNOWLEDGED"
    assert ack.acknowledged_by == "Officer Ramesh"
    assert ack.acknowledged_at is not None

    # 2. Assign
    assigned = assign_alert(db, alert.id, assigned_to="NDRF Unit 5", user_name="Commander Menon")
    assert assigned.status == "ASSIGNED"
    assert assigned.assigned_to == "NDRF Unit 5"
    assert assigned.assigned_at is not None

    # 3. Under Inspection
    inspecting = update_alert_lifecycle_status(db, alert.id, next_status="UNDER_INSPECTION", user_name="Field Team Lead")
    assert inspecting.status == "UNDER_INSPECTION"

    # 4. Resolved
    resolved = update_alert_lifecycle_status(db, alert.id, next_status="RESOLVED", user_name="Commander Menon")
    assert resolved.status == "RESOLVED"
    assert resolved.resolved_at is not None

    # 5. Closed
    closed = update_alert_lifecycle_status(db, alert.id, next_status="CLOSED", user_name="District Collector")
    assert closed.status == "CLOSED"
    assert closed.closed_at is not None


def test_field_inspection_priority_formula():
    """Verify multi-factor inspection priority calculation and transparent breakdown."""
    score, tier, breakdown = calculate_multi_factor_inspection_priority(
        risk_score=85.0,
        population=6000,
        lifeline_tier=1,
        rainfall_24h_mm=130.0,
        historical_count=3,
        risk_delta_pct=15.0,
        data_confidence=0.80
    )

    assert 80.0 <= score <= 100.0
    assert tier == "P1_IMMEDIATE"
    assert "physical_risk" in breakdown
    assert "critical_lifelines" in breakdown
    assert "rainfall_trend" in breakdown
    assert breakdown["critical_lifelines"] == 20.0
    assert breakdown["rainfall_trend"] > 10.0


def test_manual_inspection_task_creation_and_evidence(db):
    """Verify manual inspection task dispatch and physical field evidence recording."""
    loc = db.query(Location).first()
    infra = loc.infrastructures[0] if loc.infrastructures else None

    # Create task
    task = create_inspection_task(
        db=db,
        location_id=loc.id,
        infrastructure_id=infra.id if infra else None,
        reason="Field inspection requested due to tension cracks observed near road cut.",
        assigned_officer="Geologist Priya Sharma",
        assigned_team="Rapid Hazard Survey Squad",
        deadline_hours=8,
        notes="Inspect scarp boundary and toe seepage.",
        user_name="Commander DDMA"
    )

    assert task.id is not None
    assert task.task_code.startswith("INSP-")
    assert task.assigned_officer == "Geologist Priya Sharma"
    assert task.status == "DISPATCHED"
    assert task.priority_score > 0

    # Attach field evidence
    updated_task = attach_inspection_evidence(
        db=db,
        task_id=task.id,
        inspector_name="Priya Sharma",
        crack_displacement_mm=42.5,
        observed_creep_severity="SEVERE",
        seepage_observed=True,
        photo_reference_ids=["PHOTO_CRACK_001.JPG", "PHOTO_TOE_SEEP_002.JPG"],
        evidence_notes="Lateral tension crack opened by 42.5mm overnight. Water actively piping from toe."
    )

    assert updated_task.status == "INSPECTED"
    assert len(updated_task.evidence_attachments_json) == 1
    evidence = updated_task.evidence_attachments_json[0]
    assert evidence["crack_displacement_mm"] == 42.5
    assert evidence["seepage_observed"] is True
    assert "42.5 mm" in updated_task.field_notes


def test_notification_channels_and_cap_payload():
    """Verify notification channel adapters and OASIS CAP v1.2 compliance."""
    alert_sample = {
        "id": 101,
        "alert_code": "ALT-2026-0101",
        "location_name": "Meppadi High Slope Catchment",
        "district": "Wayanad",
        "latitude": 11.55,
        "longitude": 76.12,
        "risk_score": 88.5,
        "risk_category": "CRITICAL",
        "severity": "EVACUATION",
        "priority": "CRITICAL",
        "trigger_condition": "Critical rainfall breach and imminent slope failure",
        "recommended_action": "Evacuate valley hamlets immediately.",
        "affected_infrastructure": [{"name": "Meppadi Hospital", "type": "HOSPITAL", "tier": 1}],
        "is_demo": True
    }

    # Test Dispatcher routing
    receipts = notification_dispatcher.dispatch_alert(alert_sample)
    assert len(receipts) >= 4  # Console, SMS, Email, CAP

    # Test CAP Format
    cap_channel = notification_dispatcher.channels["CAP"]
    cap_output = cap_channel.send_notification(alert_sample)

    assert cap_output["identifier"] == "IN-NDMA-ALT-2026-0101"
    assert cap_output["msgType"] == "Alert"
    assert cap_output["info"]["urgency"] == "Immediate"
    assert cap_output["info"]["severity"] == "Extreme"
    assert cap_output["info"]["event"] == "Landslide Hazard Warning"
    assert cap_output["is_demo"] is True


def test_alerts_and_inspections_api_endpoints(client):
    """Verify REST API routes for alerts, inspections, summary, and thresholds."""
    # 1. Alerts list
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)

    # 2. Alerts summary
    res = client.get("/api/v1/alerts/summary")
    assert res.status_code == 200
    summary = res.json()
    assert "total_alerts" in summary
    assert "critical_priority_alerts" in summary

    # 3. Alert triggers configuration
    res = client.get("/api/v1/alerts/config")
    assert res.status_code == 200
    cfg = res.json()
    assert cfg["critical_risk_score_threshold"] == 70.0

    # 4. Inspections list
    res = client.get("/api/v1/inspections")
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)

    # 5. Trigger auto-prioritization
    res = client.post("/api/v1/inspections/prioritize")
    assert res.status_code == 200
    updated_tasks = res.json()
    assert len(updated_tasks) > 0
