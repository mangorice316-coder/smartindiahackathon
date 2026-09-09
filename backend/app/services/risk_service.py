"""Risk Assessment Domain Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import Location, RiskAssessment, ModelPrediction
from app.engine.risk_engine import assess_location_risk, classify_risk_score
from app.config import settings
from app.core.exceptions import InvalidLocationError, MissingFeatureError
from app.alerts.alert_engine import evaluate_and_generate_alerts


class RiskService:
    """Service managing risk calculations, traceability, and thresholds."""

    @staticmethod
    def assess_location(db: Session, location_id: int) -> Dict[str, Any]:
        """Perform comprehensive risk evaluation for a location."""
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise InvalidLocationError(f"Location ID {location_id} not found.")

        tf = loc.terrain_feature
        sf = loc.soil_feature
        ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
        eo = loc.environmental_observations[-1] if loc.environmental_observations else None
        lcf = loc.land_cover_feature

        if not tf or not sf:
            raise MissingFeatureError(f"Missing terrain or soil features for location ID {location_id}.")
        if not ro or not eo:
            raise MissingFeatureError(f"Missing rainfall or environmental observations for location ID {location_id}.")

        infras = [
            {"id": inf.id, "name": inf.name, "asset_type": inf.asset_type, "lifeline_tier": inf.lifeline_tier, "exposure_weight": inf.exposure_weight}
            for inf in loc.infrastructures
        ]

        result = assess_location_risk(
            location_id=loc.id,
            location_name=loc.name,
            district=loc.district,
            terrain={"slope_degrees": tf.slope_degrees, "twi": tf.twi},
            soil={"cohesion_kpa": sf.cohesion_kpa, "friction_angle_deg": sf.friction_angle_deg, "soil_depth_m": sf.soil_depth_m, "bulk_density_kn_m3": sf.bulk_density_kn_m3},
            rainfall={"intensity_1h_mm": ro.intensity_1h_mm, "accum_24h_mm": ro.accum_24h_mm, "antecedent_72h_mm": ro.antecedent_72h_mm},
            environment={"soil_moisture_ratio": eo.soil_moisture_ratio},
            land_cover={"ndvi_index": lcf.ndvi_index if lcf else 0.5, "road_cut_distance_m": lcf.road_cut_distance_m if lcf else 200.0},
            infrastructures=infras,
            population=loc.population or 1000,
            historical_count=len(loc.historical_landslides)
        )

        # Persist assessment
        ra = RiskAssessment(
            location_id=loc.id,
            timestamp=datetime.utcnow(),
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

        # Log prediction for auditability
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

        # Trigger alerts
        evaluate_and_generate_alerts(db, loc.id, result)

        result["id"] = ra.id
        result["timestamp"] = ra.timestamp
        result["is_demo"] = loc.is_demo
        return result

    @staticmethod
    def assess_all_locations(db: Session) -> List[Dict[str, Any]]:
        """Evaluate risk across all monitored locations."""
        locations = db.query(Location).all()
        return [RiskService.assess_location(db, loc.id) for loc in locations]

    @staticmethod
    def get_thresholds() -> Dict[str, Any]:
        """Return operational threshold bounds."""
        return {
            "LOW_MAX": settings.THRESHOLD_LOW_MAX,
            "MODERATE_MAX": settings.THRESHOLD_MODERATE_MAX,
            "HIGH_MAX": settings.THRESHOLD_HIGH_MAX,
            "CRITICAL_MIN": settings.THRESHOLD_HIGH_MAX
        }

    @staticmethod
    def update_thresholds(thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Update operational threshold bounds."""
        if "LOW_MAX" in thresholds:
            settings.THRESHOLD_LOW_MAX = float(thresholds["LOW_MAX"])
        if "MODERATE_MAX" in thresholds:
            settings.THRESHOLD_MODERATE_MAX = float(thresholds["MODERATE_MAX"])
        if "HIGH_MAX" in thresholds:
            settings.THRESHOLD_HIGH_MAX = float(thresholds["HIGH_MAX"])
        return RiskService.get_thresholds()
