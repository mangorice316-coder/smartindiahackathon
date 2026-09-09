"""Plausible, internally consistent DEMO dataset generator for landslide risk modeling.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Generates physically correlated synthetic datasets for:
- Locations & Catchments
- Rainfall & Moisture
- Slope & Elevation
- Geotechnical Soil Parameters
- Land Cover & NDVI
- Lithology & Geological Discontinuities
- Historical Landslide Scars
- Critical Infrastructure & Lifelines
CRITICAL MANDATE:
Every single entity generated is explicitly labeled with dataset_type="DEMO" and is_demo=True.
Never label synthetic data as real environmental observations.
"""
from datetime import datetime, timezone, timedelta
import random
import math
from typing import Dict, Any, List


class DemoDatasetGenerator:
    """Procedural generator producing physically plausible, interconnected landslide scenarios."""

    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)

    def generate_full_catchment_scenario(
        self,
        name: str,
        district: str,
        state: str,
        base_lat: float,
        base_lon: float,
        terrain_type: str = "STEEP_MONSOON"  # STEEP_MONSOON, MODERATE_VALLEY, or HIGH_ALTITUDE
    ) -> Dict[str, Any]:
        """Generate a complete, interconnected catchment ecosystem with physical consistency."""
        now = datetime.now(timezone.utc)

        # 1. Base Topography & Elevation
        if terrain_type == "STEEP_MONSOON":
            elevation_m = self.rng.uniform(700.0, 1200.0)
            slope_degrees = self.rng.uniform(32.0, 44.0)  # Critically steep
            soil_depth_m = self.rng.uniform(1.8, 3.2)
            cohesion_kpa = self.rng.uniform(10.0, 18.0)
            friction_deg = self.rng.uniform(24.0, 29.0)
            rain_24h = self.rng.uniform(110.0, 190.0)    # Heavy monsoon surge
            rain_72h = rain_24h + self.rng.uniform(80.0, 150.0)
            soil_moisture = self.rng.uniform(0.75, 0.95)
            land_cover = "Tea Plantation & Fragmented Mountain Forest"
            ndvi = 0.45
            lithology = "Charnockite & Weathered Gneiss"
        elif terrain_type == "HIGH_ALTITUDE":
            elevation_m = self.rng.uniform(1800.0, 2600.0)
            slope_degrees = self.rng.uniform(28.0, 36.0)
            soil_depth_m = self.rng.uniform(1.2, 2.5)
            cohesion_kpa = self.rng.uniform(14.0, 24.0)
            friction_deg = self.rng.uniform(28.0, 34.0)
            rain_24h = self.rng.uniform(40.0, 85.0)
            rain_72h = rain_24h + self.rng.uniform(30.0, 70.0)
            soil_moisture = self.rng.uniform(0.50, 0.70)
            land_cover = "Pine Forest & Escarpment Scrub"
            ndvi = 0.58
            lithology = "Quartzite, Schist & Moraine Debris"
        else:  # MODERATE_VALLEY
            elevation_m = self.rng.uniform(400.0, 900.0)
            slope_degrees = self.rng.uniform(15.0, 25.0)
            soil_depth_m = self.rng.uniform(3.0, 6.0)
            cohesion_kpa = self.rng.uniform(22.0, 35.0)
            friction_deg = self.rng.uniform(26.0, 32.0)
            rain_24h = self.rng.uniform(20.0, 50.0)
            rain_72h = rain_24h + self.rng.uniform(20.0, 45.0)
            soil_moisture = self.rng.uniform(0.35, 0.55)
            land_cover = "Mixed Agriculture & Settlement"
            ndvi = 0.62
            lithology = "Granite & Alluvial Terraces"

        aspect_deg = self.rng.uniform(0.0, 360.0)
        bulk_density = self.rng.uniform(17.5, 19.5)
        ksat = self.rng.uniform(15.0, 45.0)

        # 2. Historical Landslide Events
        historical_events = []
        event_count = self.rng.randint(1, 4) if slope_degrees > 25.0 else 1
        for i in range(event_count):
            days_ago = self.rng.randint(180, 3650)
            ev_date = now - timedelta(days=days_ago)
            vol = self.rng.randint(15000, 250000)
            historical_events.append({
                "event_date": ev_date.strftime("%Y-%m-%d"),
                "latitude": round(base_lat + self.rng.uniform(-0.005, 0.005), 6),
                "longitude": round(base_lon + self.rng.uniform(-0.005, 0.005), 6),
                "trigger_type": "EXTREME_RAINFALL" if rain_24h > 80 else "PROLONGED_SEEPAGE",
                "estimated_volume_m3": vol,
                "casualties": self.rng.choice([0, 0, 2, 8, 25]) if vol > 50000 else 0,
                "damage_rating": "SEVERE" if vol > 50000 else "MODERATE",
                "confidence": "HIGH",
                "is_demo": True,
                "dataset_type": "DEMO",
            })

        # 3. Infrastructure Assets in proximity
        infrastructure = [
            {
                "name": f"{name} Community Settlement",
                "asset_type": "VILLAGE",
                "latitude": round(base_lat + 0.002, 6),
                "longitude": round(base_lon - 0.002, 6),
                "lifeline_tier": 2,
                "capacity": self.rng.randint(400, 3500),
                "exposure_weight": 0.85,
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            {
                "name": f"{district} Sector Road & Hairpin Pass",
                "asset_type": "ROAD",
                "latitude": round(base_lat - 0.001, 6),
                "longitude": round(base_lon + 0.003, 6),
                "lifeline_tier": 1,
                "capacity": 1500,
                "exposure_weight": 0.90,
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            {
                "name": f"{name} Stream Crossing Bridge",
                "asset_type": "BRIDGE",
                "latitude": round(base_lat - 0.003, 6),
                "longitude": round(base_lon - 0.001, 6),
                "lifeline_tier": 2,
                "capacity": 800,
                "exposure_weight": 0.80,
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            {
                "name": f"{name} Primary Health Post",
                "asset_type": "HOSPITAL",
                "latitude": round(base_lat + 0.004, 6),
                "longitude": round(base_lon + 0.001, 6),
                "lifeline_tier": 1,
                "capacity": 150,
                "exposure_weight": 0.98,
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            {
                "name": f"{name} Government High School",
                "asset_type": "SCHOOL",
                "latitude": round(base_lat + 0.003, 6),
                "longitude": round(base_lon - 0.004, 6),
                "lifeline_tier": 2,
                "capacity": 450,
                "exposure_weight": 0.88,
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            {
                "name": f"{district} Emergency Dispatch Outpost",
                "asset_type": "EMERGENCY_FACILITY",
                "latitude": round(base_lat - 0.004, 6),
                "longitude": round(base_lon + 0.002, 6),
                "lifeline_tier": 1,
                "capacity": 60,
                "exposure_weight": 0.95,
                "is_demo": True,
                "dataset_type": "DEMO",
            },
        ]

        return {
            "dataset_type": "DEMO",
            "is_demo": True,
            "generated_at": now.isoformat(),
            "disclaimer": "PROBABILISTIC SYNTHETIC DEMONSTRATION DATASET. Not for life-safety operational deployment without official sensor calibration.",
            "location": {
                "name": name,
                "district": district,
                "state": state,
                "latitude": base_lat,
                "longitude": base_lon,
                "elevation_m": round(elevation_m, 1),
                "population": self.rng.randint(3000, 25000),
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            "terrain": {
                "slope_degrees": round(slope_degrees, 1),
                "aspect_degrees": round(aspect_deg, 1),
                "elevation_m": round(elevation_m, 1),
                "profile_curvature": round(self.rng.uniform(-0.5, 0.5), 3),
                "plan_curvature": round(self.rng.uniform(-0.4, 0.4), 3),
                "twi": round(self.rng.uniform(8.0, 14.0), 1),
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            "rainfall": {
                "intensity_1h_mm": round(rain_24h * 0.15, 2),
                "accum_24h_mm": round(rain_24h, 2),
                "antecedent_72h_mm": round(rain_72h, 2),
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            "soil": {
                "cohesion_kpa": round(cohesion_kpa, 2),
                "friction_angle_deg": round(friction_deg, 1),
                "soil_depth_m": round(soil_depth_m, 2),
                "bulk_density_kn_m3": round(bulk_density, 1),
                "ksat_mm_hr": round(ksat, 1),
                "soil_moisture_ratio": round(soil_moisture, 3),
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            "land_cover": {
                "land_cover_type": land_cover,
                "ndvi_index": round(ndvi, 2),
                "tree_canopy_pct": round(self.rng.uniform(20.0, 65.0), 1),
                "road_cut_distance_m": round(self.rng.uniform(25.0, 350.0), 1),
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            "geology": {
                "lithology_class": lithology,
                "weathering_grade": "Moderately to Highly Weathered",
                "fault_distance_m": round(self.rng.uniform(150.0, 1800.0), 1),
                "bedding_dip_deg": round(self.rng.uniform(20.0, 45.0), 1),
                "is_demo": True,
                "dataset_type": "DEMO",
            },
            "historical_landslides": historical_events,
            "infrastructure": infrastructure,
        }
