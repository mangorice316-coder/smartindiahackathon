"""High-Fidelity Synthetic Demo Data Providers.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides calibrated, internally consistent geotechnical, terrain, and hydrological
profiles for vulnerable Western Ghats and Himalayan catchments.
All records explicitly tagged with is_demo=True and dataset_type=DEMO.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import math
from app.data_engine.types import (
    DataCategory,
    ProviderMetadata,
    DataQualityStatus,
)
from app.data_engine.providers.interfaces import (
    RainfallProvider,
    TerrainProvider,
    SoilProvider,
    LandCoverProvider,
    GeologyProvider,
    HistoricalLandslideProvider,
    InfrastructureProvider,
)
from app.data_adapters.demo_adapter import DEMO_HOTSPOTS


def _find_closest_hotspot(lat: float, lon: float) -> Dict[str, Any]:
    """Find the nearest demo catchment hotspot using Euclidean approximation."""
    best = DEMO_HOTSPOTS[0]
    min_dist = float("inf")
    for spot in DEMO_HOTSPOTS:
        d = (spot["latitude"] - lat) ** 2 + (spot["longitude"] - lon) ** 2
        if d < min_dist:
            min_dist = d
            best = spot
    return best


class DemoRainfallProvider(RainfallProvider):
    """Calibrated synthetic rainfall provider generating plausible monsoon patterns."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-rainfall-v1",
            name="Synthetic Meteorological Hydro-Station Network",
            category=DataCategory.RAINFALL,
            source_attribution="DEMO SYNTHETIC CATCHMENT SENSOR ARRAY (Western Ghats & Himalayas)",
            is_demo=True,
            update_frequency_seconds=900,
            coverage_description="5 high-risk mountainous sub-catchments in Kerala, Uttarakhand, HP, and Tamil Nadu",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        return await self.fetch_current_rainfall(latitude, longitude)

    async def fetch_current_rainfall(self, latitude: float, longitude: float) -> Dict[str, Any]:
        spot = _find_closest_hotspot(latitude, longitude)
        rain = spot["rainfall"]
        return {
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
            "region": spot["name"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "intensity_1h_mm": rain["intensity_1h_mm"],
            "accum_24h_mm": rain["accum_24h_mm"],
            "antecedent_72h_mm": rain["antecedent_72h_mm"],
            "soil_moisture_ratio": spot["environmental"]["soil_moisture_ratio"],
            "is_demo": True,
        }

    async def fetch_hourly_series(self, latitude: float, longitude: float, hours: int = 168) -> List[Dict[str, Any]]:
        """Synthesize plausible time-series of hourly rainfall leading to the current state."""
        spot = _find_closest_hotspot(latitude, longitude)
        current_24h = spot["rainfall"]["accum_24h_mm"]
        now = datetime.now(timezone.utc)
        series = []

        # Generate realistic diurnal curve with storm pulse
        for i in range(hours - 1, -1, -1):
            ts = now - timedelta(hours=i)
            # Monsoon pulse centered around 12-24 hours ago
            pulse = math.exp(-((i - 18) ** 2) / 36.0)
            base_rate = (current_24h / 24.0) * (0.3 + 2.5 * pulse)
            series.append({
                "timestamp": ts.isoformat(),
                "intensity_1h_mm": round(max(0.0, base_rate), 2),
                "is_demo": True,
            })
        return series


class DemoTerrainProvider(TerrainProvider):
    """Calibrated digital elevation and terrain derivative provider."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-terrain-v1",
            name="Synthetic High-Resolution Digital Elevation Model (SRTM/ALOS calibrated)",
            category=DataCategory.TERRAIN,
            source_attribution="DEMO TERRAIN DERIVATIVE REGISTRY (30m Grid Mesh)",
            is_demo=True,
            update_frequency_seconds=86400 * 30,
            coverage_description="Topographic elevation and slope derivatives for monitored catchments",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        return self.get_terrain_derivatives(latitude, longitude)

    def get_elevation(self, latitude: float, longitude: float) -> float:
        spot = _find_closest_hotspot(latitude, longitude)
        return float(spot["elevation_m"])

    def get_terrain_derivatives(self, latitude: float, longitude: float) -> Dict[str, Any]:
        spot = _find_closest_hotspot(latitude, longitude)
        t = spot["terrain"]
        return {
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
            "elevation_m": spot["elevation_m"],
            "region": spot["name"],
            "slope_degrees": t["slope_degrees"],
            "aspect_degrees": t["aspect_degrees"],
            "profile_curvature": t["profile_curvature"],
            "plan_curvature": t["plan_curvature"],
            "twi": t["twi"],
            "is_demo": True,
        }

    def get_elevation_grid(self, latitude: float, longitude: float, grid_size: int = 3, cell_size_m: float = 30.0) -> List[List[float]]:
        """Generate physically consistent 3x3 or NxN elevation matrix matching the catchment's slope."""
        spot = _find_closest_hotspot(latitude, longitude)
        base_elev = spot["elevation_m"]
        slope_rad = math.radians(spot["terrain"]["slope_degrees"])
        aspect_rad = math.radians(spot["terrain"]["aspect_degrees"])

        # dz/dx and dz/dy based on slope and aspect
        grad_x = math.tan(slope_rad) * math.sin(aspect_rad)
        grad_y = math.tan(slope_rad) * math.cos(aspect_rad)

        half = grid_size // 2
        grid = []
        for r in range(grid_size):
            row = []
            dy = (half - r) * cell_size_m
            for c in range(grid_size):
                dx = (c - half) * cell_size_m
                elev = base_elev + (dx * grad_x) + (dy * grad_y)
                row.append(round(elev, 2))
            grid.append(row)
        return grid


class DemoSoilProvider(SoilProvider):
    """Calibrated geotechnical soil mechanics provider."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-soil-v1",
            name="Synthetic Geotechnical Soil Borehole Core Database",
            category=DataCategory.SOIL,
            source_attribution="DEMO GEOTECHNICAL BOREHOLE REGISTRY",
            is_demo=True,
            update_frequency_seconds=86400 * 90,
            coverage_description="Regolith shear strength parameters across high-risk slip planes",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        return self.get_soil_properties(latitude, longitude)

    def get_soil_properties(self, latitude: float, longitude: float) -> Dict[str, Any]:
        spot = _find_closest_hotspot(latitude, longitude)
        s = spot["soil"]
        return {
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
            "region": spot["name"],
            "soil_type": s["soil_type"],
            "cohesion_kpa": s["cohesion_kpa"],
            "friction_angle_deg": s["friction_angle_deg"],
            "ksat_mm_hr": s["ksat_mm_hr"],
            "soil_depth_m": s["soil_depth_m"],
            "bulk_density_kn_m3": s["bulk_density_kn_m3"],
            "is_demo": True,
        }


class DemoLandCoverProvider(LandCoverProvider):
    """Calibrated land cover and vegetation provider."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-landcover-v1",
            name="Synthetic Earth Observation Land Cover & NDVI Service",
            category=DataCategory.LAND_COVER,
            source_attribution="DEMO EARTH OBSERVATION REGISTRY (Sentinel-2 calibrated)",
            is_demo=True,
            update_frequency_seconds=86400 * 5,
            coverage_description="Land use classifications, canopy density, and road-cut proximity",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        return self.get_land_cover(latitude, longitude)

    def get_land_cover(self, latitude: float, longitude: float) -> Dict[str, Any]:
        spot = _find_closest_hotspot(latitude, longitude)
        lc = spot["land_cover"]
        return {
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
            "region": spot["name"],
            "land_cover_type": lc["land_cover_type"],
            "ndvi_index": lc["ndvi_index"],
            "tree_canopy_pct": lc["tree_canopy_pct"],
            "road_cut_distance_m": lc["road_cut_distance_m"],
            "is_demo": True,
        }


class DemoGeologyProvider(GeologyProvider):
    """Calibrated lithology and structural geology provider."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-geology-v1",
            name="Synthetic Lithology & Discontinuity Registry",
            category=DataCategory.GEOLOGY,
            source_attribution="DEMO STRUCTURAL GEOLOGY REGISTRY",
            is_demo=True,
            update_frequency_seconds=86400 * 365,
            coverage_description="Rock mass classification, weathering grades, and fault line mapping",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        return self.get_geology(latitude, longitude)

    def get_geology(self, latitude: float, longitude: float) -> Dict[str, Any]:
        spot = _find_closest_hotspot(latitude, longitude)
        g = spot["geology"]
        return {
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
            "region": spot["name"],
            "lithology_class": g["lithology_class"],
            "weathering_grade": g["weathering_grade"],
            "fault_distance_m": g["fault_distance_m"],
            "bedding_dip_deg": g["bedding_dip_deg"],
            "is_demo": True,
        }


class DemoHistoricalLandslideProvider(HistoricalLandslideProvider):
    """Calibrated historical landslide catalog provider."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-history-v1",
            name="Synthetic Historical Landslide Inventory (GSI NLSM calibrated)",
            category=DataCategory.HISTORICAL_LANDSLIDES,
            source_attribution="DEMO LANDSLIDE SCAR INVENTORY",
            is_demo=True,
            update_frequency_seconds=86400 * 30,
            coverage_description="Historical failure footprints, dates, trigger conditions, and casualties",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        scars = self.get_historical_scars(latitude, longitude)
        return {"scars": scars, "count": len(scars), "is_demo": True}

    def get_historical_scars(self, latitude: float, longitude: float, radius_km: float = 25.0) -> List[Dict[str, Any]]:
        spot = _find_closest_hotspot(latitude, longitude)
        scars = []
        for ev in spot.get("historical_events", []):
            scars.append({
                "event_date": ev["event_date"].strftime("%Y-%m-%d") if hasattr(ev["event_date"], "strftime") else str(ev["event_date"]),
                "latitude": spot["latitude"] + 0.002,
                "longitude": spot["longitude"] + 0.001,
                "trigger_type": ev["trigger_type"],
                "estimated_volume_m3": ev["estimated_volume_m3"],
                "casualties": ev["casualties"],
                "damage_rating": ev["damage_rating"],
                "notes": ev.get("notes", "Historical debris avalanche"),
                "confidence": "HIGH",
                "affected_area_m2": ev["estimated_volume_m3"] * 0.15,
                "source": "DEMO_GSI_INVENTORY",
                "is_demo": True,
            })
        return scars


class DemoInfrastructureProvider(InfrastructureProvider):
    """Calibrated infrastructure and critical lifeline asset provider."""

    def get_metadata(self) -> ProviderMetadata:
        return ProviderMetadata(
            provider_id="demo-infra-v1",
            name="Synthetic Critical Lifeline & Exposure Registry",
            category=DataCategory.INFRASTRUCTURE,
            source_attribution="DEMO LIFELINE INFRASTRUCTURE REGISTRY",
            is_demo=True,
            update_frequency_seconds=86400 * 7,
            coverage_description="Hospitals, schools, highways, bridges, villages, and emergency hubs",
        )

    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        assets = self.get_infrastructure_assets(latitude, longitude)
        return {"assets": assets, "count": len(assets), "is_demo": True}

    def get_infrastructure_assets(self, latitude: float, longitude: float, radius_km: float = 15.0) -> List[Dict[str, Any]]:
        spot = _find_closest_hotspot(latitude, longitude)
        assets = []
        for inf in spot.get("infrastructure", []):
            # Normalize asset types to standard categories:
            # VILLAGE, ROAD, BRIDGE, SCHOOL, HOSPITAL, EMERGENCY_FACILITY
            raw_type = inf.get("asset_type", "ROAD").upper()
            std_type = "ROAD"
            if "HEALTH" in raw_type or "HOSPITAL" in raw_type:
                std_type = "HOSPITAL"
            elif "SCHOOL" in raw_type or "COLLEGE" in raw_type or "UNIVERSITY" in raw_type:
                std_type = "SCHOOL"
            elif "BRIDGE" in raw_type:
                std_type = "BRIDGE"
            elif "SETTLEMENT" in raw_type or "VILLAGE" in raw_type or "RESIDENTIAL" in raw_type:
                std_type = "VILLAGE"
            elif "EMERGENCY" in raw_type or "POLICE" in raw_type or "FIRE" in raw_type:
                std_type = "EMERGENCY_FACILITY"
            elif "HIGHWAY" in raw_type or "ROAD" in raw_type:
                std_type = "ROAD"

            assets.append({
                "name": inf["name"],
                "asset_type": std_type,
                "latitude": spot["latitude"] + 0.0015,
                "longitude": spot["longitude"] - 0.0012,
                "location_name": spot["name"],
                "district": spot["district"],
                "lifeline_tier": inf.get("lifeline_tier", 2),
                "capacity": inf.get("capacity", 500),
                "exposure_weight": inf.get("exposure_weight", 0.8),
                "is_demo": True,
            })
        return assets
