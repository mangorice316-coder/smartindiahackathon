"""Meteorological & Weather Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import Location, RainfallObservation, EnvironmentalObservation
from app.config import settings
from app.data_adapters.open_meteo_adapter import OpenMeteoWeatherAdapter
from app.core.exceptions import InvalidLocationError

open_meteo = OpenMeteoWeatherAdapter()


class WeatherService:
    """Service handling real-time and synthetic weather observations."""

    @staticmethod
    async def get_live_weather(db: Session, location_id: int) -> Dict[str, Any]:
        """Fetch current weather according to operating mode (DEMO vs REAL)."""
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise InvalidLocationError(f"Location ID {location_id} not found.")

        if settings.DATA_MODE == "REAL":
            return await open_meteo.fetch_current_rainfall(loc.latitude, loc.longitude)

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

    @staticmethod
    async def get_forecast(db: Session, location_id: int, hours: int = 72) -> List[Dict[str, Any]]:
        """Fetch forward precipitation forecast."""
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise InvalidLocationError(f"Location ID {location_id} not found.")
        return await open_meteo.fetch_forecast_rainfall(loc.latitude, loc.longitude, hours=hours)
