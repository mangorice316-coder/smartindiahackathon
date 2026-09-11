"""Meteorological & Weather Ingestion API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides access to demo telemetry and external Open-Meteo live feeds.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from datetime import datetime, timezone
from app.models.entities import (
    Location, User, RainfallObservation, EnvironmentalObservation, RiskAssessment
)
from app.auth.security import require_role
from app.data_adapters.open_meteo_adapter import OpenMeteoWeatherAdapter
from app.data_adapters.demo_adapter import seed_demo_data
from app.engine.risk_engine import assess_location_risk
from app.alerts.alert_engine import evaluate_and_generate_alerts
from app.inspections.prioritizer import generate_prioritized_inspections
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/weather", tags=["Meteorological & Rainfall Telemetry"])
open_meteo_adapter = OpenMeteoWeatherAdapter()


async def run_live_meteorology_sync(db: Session) -> List[Dict[str, Any]]:
    """Synchronize live Open-Meteo observations for all monitored catchments and recalculate risk."""
    locations = db.query(Location).all()
    synced_locations = []

    for loc in locations:
        weather_data = await open_meteo_adapter.fetch_current_rainfall(loc.latitude, loc.longitude)

        # 1. Record new live rainfall observation
        ro = RainfallObservation(
            location_id=loc.id,
            timestamp=datetime.now(timezone.utc),
            intensity_1h_mm=weather_data.get("intensity_1h_mm", 0.0),
            accum_24h_mm=weather_data.get("accum_24h_mm", 0.0),
            antecedent_72h_mm=weather_data.get("antecedent_72h_mm", 0.0),
            cumulative_7d_mm=weather_data.get("cumulative_7d_mm", 0.0),
            source=weather_data.get("source", "OPEN_METEO_LIVE"),
            is_demo=False
        )
        db.add(ro)

        # 2. Record new live environmental observation
        eo = EnvironmentalObservation(
            location_id=loc.id,
            timestamp=datetime.now(timezone.utc),
            temperature_c=weather_data.get("temperature_c", 22.0),
            relative_humidity_pct=weather_data.get("relative_humidity_pct", 80.0),
            soil_moisture_ratio=weather_data.get("soil_moisture_ratio", 0.50),
            pore_water_pressure_kpa=round(weather_data.get("soil_moisture_ratio", 0.50) * 25.0, 2),
            source="OPEN_METEO_LIVE",
            is_demo=False
        )
        db.add(eo)
        db.flush()

        # 3. Recalculate physics and ML risk assessment
        tf = loc.terrain_feature
        sf = loc.soil_feature
        lcf = loc.land_cover_feature
        infras = [
            {
                "id": inf.id,
                "name": inf.name,
                "asset_type": inf.asset_type,
                "lifeline_tier": inf.lifeline_tier,
                "exposure_weight": inf.exposure_weight
            }
            for inf in loc.infrastructures
        ]

        if tf and sf and lcf:
            result = assess_location_risk(
                location_id=loc.id,
                location_name=loc.name,
                district=loc.district,
                terrain={"slope_degrees": tf.slope_degrees, "twi": tf.twi},
                soil={
                    "cohesion_kpa": sf.cohesion_kpa,
                    "friction_angle_deg": sf.friction_angle_deg,
                    "soil_depth_m": sf.soil_depth_m,
                    "bulk_density_kn_m3": sf.bulk_density_kn_m3
                },
                rainfall={
                    "intensity_1h_mm": ro.intensity_1h_mm,
                    "accum_24h_mm": ro.accum_24h_mm,
                    "antecedent_72h_mm": ro.antecedent_72h_mm
                },
                environment={"soil_moisture_ratio": eo.soil_moisture_ratio},
                land_cover={"ndvi_index": lcf.ndvi_index, "road_cut_distance_m": lcf.road_cut_distance_m},
                infrastructures=infras,
                population=loc.population or 1000,
                historical_count=len(loc.historical_landslides)
            )

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
                is_demo=False
            )
            db.add(ra)
            evaluate_and_generate_alerts(db, loc.id, result)

        synced_locations.append({
            "location_id": loc.id,
            "name": loc.name,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "accum_24h_mm": weather_data.get("accum_24h_mm"),
            "antecedent_72h_mm": weather_data.get("antecedent_72h_mm"),
            "temperature_c": weather_data.get("temperature_c"),
            "soil_moisture_pct": round(weather_data.get("soil_moisture_ratio", 0.5) * 100, 1),
            "source": weather_data.get("source")
        })

    generate_prioritized_inspections(db)
    db.commit()
    return synced_locations


@router.get("/live")
async def get_live_weather(
    location_id: int = Query(..., description="Target catchment ID"),
    db: Session = Depends(get_db)
):
    """Retrieve weather observations. Uses Open-Meteo in REAL mode, or DB in DEMO mode."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location ID {location_id} not found.")

    if settings.DATA_MODE == "REAL":
        return await open_meteo_adapter.fetch_current_rainfall(loc.latitude, loc.longitude)
    else:
        ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
        eo = loc.environmental_observations[-1] if loc.environmental_observations else None
        return {
            "source": "DEMO_SYNTHETIC",
            "location_id": loc.id,
            "location_name": loc.name,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "intensity_1h_mm": ro.intensity_1h_mm if ro else 10.0,
            "accum_24h_mm": ro.accum_24h_mm if ro else 45.0,
            "antecedent_72h_mm": ro.antecedent_72h_mm if ro else 95.0,
            "cumulative_7d_mm": ro.cumulative_7d_mm if ro else 140.0,
            "temperature_c": eo.temperature_c if eo else 21.0,
            "relative_humidity_pct": eo.relative_humidity_pct if eo else 88.0,
            "soil_moisture_ratio": eo.soil_moisture_ratio if eo else 0.55,
            "is_demo": True
        }


@router.get("/forecast")
async def get_weather_forecast(
    location_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Retrieve forward-looking 72h precipitation forecast."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location ID {location_id} not found.")

    return await open_meteo_adapter.fetch_forecast_rainfall(loc.latitude, loc.longitude, hours=72)


@router.get("/live-coordinate")
async def get_live_weather_for_coordinate(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Target GPS latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Target GPS longitude")
):
    """Retrieve live real-time Open-Meteo weather and soil telemetry for any arbitrary GPS coordinate on Earth."""
    return await open_meteo_adapter.fetch_current_rainfall(latitude, longitude)


@router.post("/sync-live")
async def sync_live_weather(
    db: Session = Depends(get_db)
):
    """Ingest live Open-Meteo observations for all monitored catchments, recalculate risk and alerts."""
    settings.DATA_MODE = "REAL"
    synced = await run_live_meteorology_sync(db)

    log_audit_event(
        db=db,
        action_type="SYNC_LIVE_METEOROLOGY",
        user_name="DISASTER_COMMANDER",
        payload_summary={"synced_count": len(synced), "data_mode": "REAL"}
    )

    return {
        "status": "LIVE_SYNC_COMPLETED",
        "data_mode": "REAL",
        "synced_catchments_count": len(synced),
        "source": "OPEN_METEO_REST_API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "synced_locations": synced
    }


@router.post("/switch-mode")
async def switch_operating_mode(
    payload: Dict[str, str] = Body(...),
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Toggle between DEMO mode (calibrated synthetic scenario) and REAL mode (live Open-Meteo feeds)."""
    target_mode = payload.get("mode", "DEMO").upper()
    if target_mode not in ["DEMO", "REAL"]:
        target_mode = "DEMO"

    settings.DATA_MODE = target_mode
    details = ""

    if target_mode == "REAL":
        synced = await run_live_meteorology_sync(db)
        details = f"Live telemetry synced for {len(synced)} catchments from Open-Meteo."
    else:
        seed_demo_data(db, force_reset=True)
        generate_prioritized_inspections(db)
        details = "Restored calibrated baseline disaster scenario (Wayanad 2024)."

    log_audit_event(
        db=db,
        action_type="SWITCH_OPERATING_MODE",
        user_name=current_user.username,
        payload_summary={"data_mode": target_mode}
    )

    return {
        "status": "SWITCHED",
        "current_data_mode": settings.DATA_MODE,
        "details": details,
        "note": "All UI views and inference runs reflect the selected operating mode."
    }
