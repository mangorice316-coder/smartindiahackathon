"""Scientific Landslide Risk Assessment Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Separates Hazard (physical likelihood), Exposure (lives & assets), and Vulnerability.
"""
from typing import Dict, Any, List, Optional
from app.config import settings
from app.physics.slope_stability import calculate_factor_of_safety, fs_to_hazard_score
from app.ml.model_registry import get_active_pipeline
from app.models.schemas import RiskExplanation, ContributingFactor


def classify_risk_score(score: float) -> str:
    """Classify numerical risk score [0, 100] into configurable category."""
    if score <= settings.THRESHOLD_LOW_MAX:
        return "LOW"
    elif score <= settings.THRESHOLD_MODERATE_MAX:
        return "MODERATE"
    elif score <= settings.THRESHOLD_HIGH_MAX:
        return "HIGH"
    else:
        return "CRITICAL"


def compute_hazard_score(ml_prob: float, geotechnical_fs: float) -> float:
    """Compute physical Hazard score [0, 100].

    Combines data-driven ML initiation probability (55%) with
    geotechnical Factor of Safety limit-equilibrium mechanics (45%).
    """
    ml_hazard = ml_prob * 100.0
    geo_hazard = fs_to_hazard_score(geotechnical_fs)
    hazard = 0.55 * ml_hazard + 0.45 * geo_hazard
    return round(max(0.0, min(100.0, hazard)), 2)


def compute_exposure_score(
    population: int,
    infrastructures: List[Dict[str, Any]],
    area_km2: Optional[float] = None
) -> float:
    """Compute community and asset Exposure score [0, 100].

    Considers:
    - Population density / count (40% weight)
    - Critical lifeline infrastructure like highways, hospitals, bridges (60% weight)
    """
    # 1. Population Exposure (normalized against typical taluk cluster of 15,000)
    pop_norm = min(100.0, (population / 12000.0) * 100.0)

    # 2. Critical Infrastructure Exposure
    infra_points = 0.0
    for asset in infrastructures:
        tier = asset.get("lifeline_tier", 2)
        asset_type = str(asset.get("asset_type", "")).upper()
        weight = float(asset.get("exposure_weight", 1.0))

        if "HOSPITAL" in asset_type:
            infra_points += 25.0 * weight
        elif "HIGHWAY" in asset_type or "BRIDGE" in asset_type:
            infra_points += 20.0 * weight
        elif "POWER" in asset_type or "SUBSTATION" in asset_type:
            infra_points += 15.0 * weight
        elif "SCHOOL" in asset_type:
            infra_points += 15.0 * weight
        else:
            infra_points += 8.0 * weight

    infra_norm = min(100.0, infra_points)

    exposure = 0.40 * pop_norm + 0.60 * infra_norm
    return round(max(5.0, min(100.0, exposure)), 2)


def assess_location_risk(
    location_id: int,
    location_name: str,
    district: str,
    terrain: Dict[str, Any],
    soil: Dict[str, Any],
    rainfall: Dict[str, Any],
    environment: Dict[str, Any],
    land_cover: Dict[str, Any],
    infrastructures: List[Dict[str, Any]],
    population: int,
    historical_count: int = 0
) -> Dict[str, Any]:
    """Execute complete risk assessment for a specific location.

    Returns full assessment payload with Hazard, Exposure, Total Risk, Fs, and XAI.
    """
    # 1. Geotechnical Infinite Slope Stability
    slope_deg = float(terrain.get("slope_degrees", 25.0))
    c_kpa = float(soil.get("cohesion_kpa", 18.0))
    phi_deg = float(soil.get("friction_angle_deg", 28.0))
    depth_m = float(soil.get("soil_depth_m", 2.0))
    gamma = float(soil.get("bulk_density_kn_m3", 18.5))
    moisture = float(environment.get("soil_moisture_ratio", 0.45))

    fs, geo_breakdown = calculate_factor_of_safety(
        slope_degrees=slope_deg,
        cohesion_kpa=c_kpa,
        friction_angle_deg=phi_deg,
        soil_depth_m=depth_m,
        bulk_density_kn_m3=gamma,
        saturation_ratio_m=moisture
    )

    # 2. Machine Learning Initiation Probability
    feature_vector = {
        "slope_degrees": slope_deg,
        "twi": float(terrain.get("twi", 7.5)),
        "rainfall_intensity_1h": float(rainfall.get("intensity_1h_mm", 10.0)),
        "rainfall_accum_24h": float(rainfall.get("accum_24h_mm", 60.0)),
        "rainfall_antecedent_72h": float(rainfall.get("antecedent_72h_mm", 140.0)),
        "soil_moisture_ratio": moisture,
        "soil_cohesion_kpa": c_kpa,
        "ndvi_vegetation": float(land_cover.get("ndvi_index", 0.6)),
        "historical_event_density": historical_count,
        "road_cut_distance_m": float(land_cover.get("road_cut_distance_m", 150.0))
    }

    pipeline = get_active_pipeline()
    ml_prob = pipeline.predict_probability(feature_vector)
    xai_factors = pipeline.explain_prediction(feature_vector)

    # 3. Hazard, Exposure, and Total Risk
    hazard_score = compute_hazard_score(ml_prob, fs)
    exposure_score = compute_exposure_score(population, infrastructures)

    # Total Risk R = min(100, H^0.65 * E^0.35)
    # When Hazard is near zero, Risk is zero even with high exposure.
    if hazard_score <= 2.0:
        overall_risk = round(hazard_score, 1)
    else:
        overall_risk = round(min(100.0, (hazard_score ** 0.65) * (exposure_score ** 0.35)), 1)

    risk_category = classify_risk_score(overall_risk)

    # Model confidence: higher when ML and physics agree
    fs_hazard = fs_to_hazard_score(fs)
    agreement = 1.0 - (abs((ml_prob * 100.0) - fs_hazard) / 100.0)
    model_confidence = round(float(max(0.60, min(0.98, 0.70 + (0.28 * agreement)))), 2)

    # Explanations
    stability_label = geo_breakdown.get("classification", "STABLE")
    geo_narrative = (
        f"Geotechnical Factor of Safety Fs = {fs} ({stability_label}). "
        f"Pore-water pressure has reduced frictional shear strength by {geo_breakdown.get('pore_pressure_loss_pct', 0)}% "
        f"at a slope inclination of {slope_deg}°."
    )
    ml_narrative = (
        f"ML Initiation Probability is {round(ml_prob * 100, 1)}% based on 72h antecedent rainfall of "
        f"{feature_vector['rainfall_antecedent_72h']}mm and saturation ratio of {moisture}."
    )

    top_factors_schema = [
        ContributingFactor(
            factor_name=f["factor_name"],
            display_name=f["display_name"],
            value=f["value"],
            unit=f["unit"],
            contribution_score=f["contribution_score"],
            direction=f["direction"],
            description=f["description"]
        ) for f in xai_factors
    ]

    explanation = RiskExplanation(
        top_factors=top_factors_schema,
        geotechnical_narrative=geo_narrative,
        ml_confidence_narrative=ml_narrative,
        data_freshness_status="REAL_TIME_OR_SIMULATED",
        missing_data_warnings=[]
    )

    return {
        "location_id": location_id,
        "location_name": location_name,
        "district": district,
        "hazard_score": hazard_score,
        "exposure_score": exposure_score,
        "overall_risk_score": overall_risk,
        "risk_category": risk_category,
        "geotechnical_fs": fs,
        "geotechnical_stability": stability_label,
        "model_confidence": model_confidence,
        "model_version_tag": pipeline.version_tag or "RF_LANDSLIDE_v1.0",
        "explanation": explanation,
        "feature_vector": feature_vector,
        "geotechnical_breakdown": geo_breakdown
    }
