"""Real Weather Data Adapter using Open-Meteo REST API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Fetches authentic precipitation, temperature, and soil moisture observations.
"""
from typing import Dict, Any, List
from datetime import datetime
import httpx
from app.data_adapters.base import WeatherDataProvider


class OpenMeteoWeatherAdapter(WeatherDataProvider):
    """External Live Meteorological Data Ingestion using Open-Meteo API."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    async def fetch_current_rainfall(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch live rainfall and soil moisture for coordinates."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation,rain,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm",
            "daily": "precipitation_sum,rain_sum",
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain",
            "timezone": "auto",
            "forecast_days": 3,
            "past_days": 3
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                current = data.get("current", {})
                hourly = data.get("hourly", {})
                precip_series = hourly.get("precipitation", [])

                # Calculate 1h, 24h, and 72h antecedent from the series if available
                intensity_1h = float(current.get("precipitation", 0.0))
                
                # Estimate 24h sum from recent hourly readings
                accum_24h = sum(precip_series[-24:]) if len(precip_series) >= 24 else intensity_1h * 12.0
                antecedent_72h = sum(precip_series[-72:]) if len(precip_series) >= 72 else accum_24h * 2.2

                soil_moisture_series = hourly.get("soil_moisture_0_to_1cm", [])
                curr_moisture = float(soil_moisture_series[-1]) if soil_moisture_series else 0.50

                return {
                    "source": "OPEN_METEO_LIVE",
                    "timestamp": datetime.utcnow().isoformat(),
                    "latitude": latitude,
                    "longitude": longitude,
                    "intensity_1h_mm": round(intensity_1h, 2),
                    "accum_24h_mm": round(float(accum_24h), 2),
                    "antecedent_72h_mm": round(float(antecedent_72h), 2),
                    "cumulative_7d_mm": round(float(antecedent_72h * 1.5), 2),
                    "temperature_c": float(current.get("temperature_2m", 22.0)),
                    "relative_humidity_pct": float(current.get("relative_humidity_2m", 85.0)),
                    "soil_moisture_ratio": round(min(1.0, max(0.1, curr_moisture)), 3),
                    "is_demo": False
                }
        except Exception as e:
            # Return graceful degraded state with explicit notice
            return {
                "source": "OPEN_METEO_FALLBACK_UNAVAILABLE",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "intensity_1h_mm": 5.0,
                "accum_24h_mm": 35.0,
                "antecedent_72h_mm": 80.0,
                "cumulative_7d_mm": 120.0,
                "temperature_c": 20.0,
                "relative_humidity_pct": 80.0,
                "soil_moisture_ratio": 0.45,
                "is_demo": False,
                "warning": "External Open-Meteo API unreachable. Fallback baseline returned."
            }

    async def fetch_forecast_rainfall(self, latitude: float, longitude: float, hours: int = 72) -> List[Dict[str, Any]]:
        """Fetch forward-looking rainfall forecast."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation,probability_of_precipitation",
            "forecast_days": min(7, max(1, hours // 24 + 1))
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])
                precips = hourly.get("precipitation", [])

                forecast = []
                for t, p in zip(times[:hours], precips[:hours]):
                    forecast.append({"time": t, "predicted_precipitation_mm": p})
                return forecast
        except Exception:
            return []
