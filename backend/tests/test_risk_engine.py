"""Unit Tests for Scientific Risk Assessment Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
import pytest
from app.engine.risk_engine import (
    classify_risk_score, compute_hazard_score, compute_exposure_score, assess_location_risk
)
from app.config import settings


def test_classify_risk_score_bounds():
    """Verify configurable risk threshold boundaries."""
    assert classify_risk_score(0.0) == "LOW"
    assert classify_risk_score(settings.THRESHOLD_LOW_MAX) == "LOW"
    assert classify_risk_score(settings.THRESHOLD_LOW_MAX + 1.0) == "MODERATE"
    assert classify_risk_score(settings.THRESHOLD_MODERATE_MAX) == "MODERATE"
    assert classify_risk_score(settings.THRESHOLD_MODERATE_MAX + 1.0) == "HIGH"
    assert classify_risk_score(settings.THRESHOLD_HIGH_MAX) == "HIGH"
    assert classify_risk_score(settings.THRESHOLD_HIGH_MAX + 1.0) == "CRITICAL"
    assert classify_risk_score(100.0) == "CRITICAL"


def test_hazard_and_exposure_separation():
    """Verify that hazard and exposure are calculated independently."""
    # High hazard, zero exposure -> Hazard is high, Exposure is low
    hazard = compute_hazard_score(ml_prob=0.9, geotechnical_fs=0.8)
    assert hazard > 70.0

    exposure_low = compute_exposure_score(population=50, infrastructures=[])
    assert exposure_low < 15.0

    # High exposure: large population + tier 1 hospital + bridge + highway
    exposure_high = compute_exposure_score(
        population=25000,
        infrastructures=[
            {"asset_type": "HOSPITAL", "lifeline_tier": 1, "exposure_weight": 2.0},
            {"asset_type": "HIGHWAY", "lifeline_tier": 1, "exposure_weight": 2.0},
            {"asset_type": "BRIDGE", "lifeline_tier": 1, "exposure_weight": 2.0}
        ]
    )
    assert exposure_high > 75.0


def test_complete_risk_assessment():
    """Verify end-to-end risk assessment schema and constraints."""
    result = assess_location_risk(
        location_id=1,
        location_name="Test Hill",
        district="Wayanad",
        terrain={"slope_degrees": 35.0, "twi": 10.0},
        soil={"cohesion_kpa": 14.0, "friction_angle_deg": 28.0, "soil_depth_m": 2.5, "bulk_density_kn_m3": 18.5},
        rainfall={"intensity_1h_mm": 20.0, "accum_24h_mm": 170.0, "antecedent_72h_mm": 350.0},
        environment={"soil_moisture_ratio": 0.85},
        land_cover={"ndvi_index": 0.5, "road_cut_distance_m": 50.0},
        infrastructures=[{"name": "Main Hospital", "asset_type": "HOSPITAL", "lifeline_tier": 1}],
        population=12000
    )

    assert 0.0 <= result["hazard_score"] <= 100.0
    assert 0.0 <= result["exposure_score"] <= 100.0
    assert 0.0 <= result["overall_risk_score"] <= 100.0
    assert result["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "explanation" in result
    assert len(result["explanation"].top_factors) > 0
