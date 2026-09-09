"""Meteorological & Weather Ingestion API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides access to demo telemetry and external Open-Meteo live feeds.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.entities import Location, User
from app.auth.security import require_role
from app.data_adapters.open_meteo_adapter import OpenMeteoWeatherAdapter
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/weather", tags=["Meteorological & Rainfall Telemetry"])
open_meteo_adapter = OpenMeteoWeatherAdapter()


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
        # Call live Open-Meteo API
        return await open_meteo_adapter.fetch_current_rainfall(loc.latitude, loc.longitude)
    else:
        # Return calibrated demo observation
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


@router.post("/switch-mode")
def switch_operating_mode(
    payload: Dict[str, str] = Body(...),
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Toggle between DEMO mode (clearly labeled synthetic data) and REAL mode (external APIs). Restricted to ADMIN."""
    target_mode = payload.get("mode", "DEMO").upper()
    if target_mode not in ["DEMO", "REAL"]:
        target_mode = "DEMO"

    settings.DATA_MODE = target_mode

    log_audit_event(
        db=db,
        action_type="SWITCH_OPERATING_MODE",
        user_name=current_user.username,
        payload_summary={"data_mode": target_mode}
    )

    return {
        "status": "SWITCHED",
        "current_data_mode": settings.DATA_MODE,
        "note": "All UI views and inference runs will reflect the selected operating mode."
    }
