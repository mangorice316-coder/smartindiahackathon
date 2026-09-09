"""Live external meteorological data provider interfacing with Open-Meteo REST API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Strict data provenance: sets is_demo=False and tags live numerical model source.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
import math
from app.data_engine.types import (
    DataCategory,
    ProviderMetadata,
    DataQualityStatus,
)
from app.data_engine.providers.interfaces import RainfallProvider


class OpenMeteoRainfallProvider(RainfallProvider):
    """Real-time REST meteorological provider for numerical weather prediction grids."""

    def __init__(self, timeout_seconds: float = 8.0):
        super().__init__()
        self.timeout_seconds = timeout_seconds
        self.base_url = "https://api.open-meteo.com/v1/forecast"

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="open-meteo-v1",
            name="Open-Meteo Global Numerical Weather Model Gateway",
            category=DataCategory.RAINFALL,
            source_attribution="Open-Meteo REST Meteorological Gateway (ECMWF IFS & GFS Ensemble)",
            is_demo=False,
            update_frequency_seconds=3600,
            coverage_description="Global 0.1 degree resolution meteorological grid with hourly precipitation",
            contact_or_url="https://open-meteo.com",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        return await self.fetch_current_rainfall(latitude, longitude)

    async def fetch_current_rainfall(self, latitude: float, longitude: float) -> Dict[str, Any]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation,soil_moisture_0_to_1cm",
            "daily": "precipitation_sum",
            "timezone": "UTC",
            "past_days": 3,
            "forecast_days": 1,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(self.base_url, params=params)
                if resp.status_code != 200:
                    raise RuntimeError(f"Open-Meteo API returned HTTP {resp.status_code}")
                data = resp.json()

            hourly = data.get("hourly", {})
            precip_series = hourly.get("precipitation", [])
            soil_moist_series = hourly.get("soil_moisture_0_to_1cm", [])

            # Compute actual rolling totals from the returned array
            intensity_1h = precip_series[-1] if precip_series else 0.0
            accum_24h = sum(precip_series[-24:]) if len(precip_series) >= 24 else sum(precip_series)
            antecedent_72h = sum(precip_series[-72:]) if len(precip_series) >= 72 else sum(precip_series)
            moist_val = soil_moist_series[-1] if soil_moist_series else 0.35

            self._quality_status = DataQualityStatus.HEALTHY
            return {
                "latitude": latitude,
                "longitude": longitude,
                "region": f"Coordinate ({latitude:.4f}, {longitude:.4f})",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "intensity_1h_mm": round(float(intensity_1h), 2),
                "accum_24h_mm": round(float(accum_24h), 2),
                "antecedent_72h_mm": round(float(antecedent_72h), 2),
                "soil_moisture_ratio": round(float(moist_val), 3),
                "is_demo": False,
            }
        except Exception as e:
            self._quality_status = DataQualityStatus.DEGRADED
            return {
                "latitude": latitude,
                "longitude": longitude,
                "region": f"Coordinate ({latitude:.4f}, {longitude:.4f})",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "intensity_1h_mm": 0.0,
                "accum_24h_mm": 0.0,
                "antecedent_72h_mm": 0.0,
                "soil_moisture_ratio": 0.3,
                "is_demo": False,
                "error": str(e),
                "quality_status": DataQualityStatus.DEGRADED.value,
            }

    async def fetch_hourly_series(self, latitude: float, longitude: float, hours: int = 168) -> List[Dict[str, Any]]:
        past_days = min(7, math.ceil(hours / 24))
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation",
            "timezone": "UTC",
            "past_days": past_days,
            "forecast_days": 1,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(self.base_url, params=params)
                if resp.status_code != 200:
                    raise RuntimeError(f"Open-Meteo returned HTTP {resp.status_code}")
                data = resp.json()

            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            precips = hourly.get("precipitation", [])

            series = []
            for t, p in zip(times[-hours:], precips[-hours:]):
                series.append({
                    "timestamp": t,
                    "intensity_1h_mm": float(p or 0.0),
                    "is_demo": False,
                })
            return series
        except Exception:
            # Fallback degraded series on external network outage
            self._quality_status = DataQualityStatus.DEGRADED
            now = datetime.now(timezone.utc)
            return [
                {
                    "timestamp": (now).isoformat(),
                    "intensity_1h_mm": 2.5,
                    "is_demo": True,
                    "warning": "External meteorological API unavailable. Fallback series returned."
                }
            ]

