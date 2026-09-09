"""Risk Assessment & Decision Support API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.entities import Location, RiskAssessment, ModelPrediction, User
from app.models.schemas import RiskAssessmentResponse
from app.auth.security import require_role
from app.engine.risk_engine import assess_location_risk
from app.alerts.alert_engine import evaluate_and_generate_alerts
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/risk", tags=["Risk Assessment Engine"])


@router.get("/assess/{location_id}", response_model=RiskAssessmentResponse)
def assess_risk_for_location(location_id: int, db: Session = Depends(get_db)):
    """Compute geotechnical and ML risk assessment with XAI for a single zone."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found.")

    tf = loc.terrain_feature
    sf = loc.soil_feature
    ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
    eo = loc.environmental_observations[-1] if loc.environmental_observations else None
    lcf = loc.land_cover_feature
    infras = [
        {"id": inf.id, "name": inf.name, "asset_type": inf.asset_type, "lifeline_tier": inf.lifeline_tier, "exposure_weight": inf.exposure_weight}
        for inf in loc.infrastructures
    ]

    if not (tf and sf and ro and eo and lcf):
        raise HTTPException(status_code=400, detail="Incomplete geotechnical or weather features for this location.")

    result = assess_location_risk(
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

    # Persist assessment
    ra = RiskAssessment(
        location_id=loc.id,
        timestamp=datetime.now(timezone.utc),
        hazard_score=result["hazard_score"],
        exposure_score=result["exposure_score"],
        overall_risk_score=result["overall_risk_score"],
        risk_category=result["risk_category"],
        geotechnical_fs=result["geotechnical_fs"],
        model_confidence=result["model_confidence"],
        model_version_tag=result["model_version_tag"],
        explanation_json=result["explanation"].model_dump(),
        is_demo=loc.is_demo
    )
    db.add(ra)

    # Traceable Prediction Record
    pred = ModelPrediction(
        model_version_tag=result["model_version_tag"],
        location_id=loc.id,
        feature_vector_json=result["feature_vector"],
        predicted_probability=round(result["hazard_score"] / 100.0, 4),
        hazard_score=result["hazard_score"],
        explanation_json=result["explanation"].model_dump(),
        is_demo=loc.is_demo
    )
    db.add(pred)
    db.commit()

    log_audit_event(
        db=db,
        action_type="CALCULATE_RISK_ASSESSMENT",
        user_name="SYSTEM_ESTIMATOR",
        entity_type="RiskAssessment",
        entity_id=str(ra.id),
        payload_summary={
            "location_id": loc.id,
            "overall_risk_score": result["overall_risk_score"],
            "risk_category": result["risk_category"],
            "geotechnical_fs": result["geotechnical_fs"]
        }
    )

    # Trigger alerts if thresholds breached
    evaluate_and_generate_alerts(db, loc.id, result)

    return {
        "id": ra.id,
        "location_id": loc.id,
        "location_name": loc.name,
        "district": loc.district,
        "timestamp": ra.timestamp,
        "hazard_score": result["hazard_score"],
        "exposure_score": result["exposure_score"],
        "overall_risk_score": result["overall_risk_score"],
        "risk_category": result["risk_category"],
        "geotechnical_fs": result["geotechnical_fs"],
        "geotechnical_stability": result["geotechnical_stability"],
        "model_confidence": result["model_confidence"],
        "model_version_tag": result["model_version_tag"],
        "explanation": result["explanation"],
        "is_demo": loc.is_demo
    }


@router.get("/all", response_model=List[RiskAssessmentResponse])
def assess_all_locations(db: Session = Depends(get_db)):
    """Compute real-time risk across all monitored zones."""
    locations = db.query(Location).all()
    results = []
    for loc in locations:
        res = assess_risk_for_location(loc.id, db)
        results.append(res)
    return results


@router.get("/thresholds")
def get_risk_thresholds():
    """Retrieve current operational risk thresholds."""
    return {
        "LOW_MAX": settings.THRESHOLD_LOW_MAX,
        "MODERATE_MAX": settings.THRESHOLD_MODERATE_MAX,
        "HIGH_MAX": settings.THRESHOLD_HIGH_MAX,
        "CRITICAL_MIN": settings.THRESHOLD_HIGH_MAX,
        "disclaimer": "Thresholds are operational decision bounds and should be calibrated per geographical basin."
    }


@router.post("/thresholds")
def update_risk_thresholds(
    thresholds: Dict[str, float] = Body(...),
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Dynamically update risk categorization thresholds. Restricted to ADMIN."""
    if "LOW_MAX" in thresholds:
        settings.THRESHOLD_LOW_MAX = float(thresholds["LOW_MAX"])
    if "MODERATE_MAX" in thresholds:
        settings.THRESHOLD_MODERATE_MAX = float(thresholds["MODERATE_MAX"])
    if "HIGH_MAX" in thresholds:
        settings.THRESHOLD_HIGH_MAX = float(thresholds["HIGH_MAX"])

    log_audit_event(
        db=db,
        action_type="UPDATE_RISK_THRESHOLDS",
        user_name=current_user.username,
        payload_summary=thresholds
    )

    return {"status": "UPDATED", "thresholds": get_risk_thresholds()}
