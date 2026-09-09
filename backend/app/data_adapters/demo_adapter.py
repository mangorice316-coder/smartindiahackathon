"""High-Fidelity Synthetic Demo Data Adapter.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Pre-configured with realistic geotechnical, terrain, and hydrological profiles for
five highly vulnerable landslide hotspots in the Western Ghats and Himalayas.
All records are explicitly flagged with `is_demo=True` or `source="DEMO_SYNTHETIC"`.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import (
    Location, TerrainFeature, SoilFeature, GeologyFeature, LandCoverFeature,
    EnvironmentalObservation, RainfallObservation, HistoricalLandslide,
    Infrastructure, DataSource, DataQualityRecord, User
)
from app.auth.security import get_password_hash


DEMO_HOTSPOTS = [
    {
        "code": "KL-WAY-01",
        "name": "Meppadi - Chooralmala Catchment",
        "taluk": "Vythiri",
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 11.5365,
        "longitude": 76.1322,
        "elevation_m": 880.0,
        "area_km2": 42.5,
        "population": 14200,
        "boundary_coords": [
            [76.115, 11.550], [76.148, 11.552], [76.155, 11.525],
            [76.128, 11.518], [76.115, 11.550]
        ],
        "terrain": {
            "slope_degrees": 36.5,
            "aspect_degrees": 220.0,
            "elevation_m": 880.0,
            "profile_curvature": 0.45,
            "plan_curvature": -0.32,
            "twi": 11.8
        },
        "soil": {
            "soil_type": "Humic Laterite & Colluvium",
            "cohesion_kpa": 14.5,
            "friction_angle_deg": 26.5,
            "ksat_mm_hr": 35.0,
            "soil_depth_m": 2.8,
            "bulk_density_kn_m3": 18.2
        },
        "geology": {
            "lithology_class": "Charnockite & Hornblende Gneiss",
            "weathering_grade": "Highly Weathered",
            "fault_distance_m": 350.0,
            "bedding_dip_deg": 32.0
        },
        "land_cover": {
            "land_cover_type": "Tea Plantation & Fragmented Shola Forest",
            "ndvi_index": 0.48,
            "tree_canopy_pct": 38.0,
            "road_cut_distance_m": 45.0
        },
        "rainfall": {
            "intensity_1h_mm": 24.5,
            "accum_24h_mm": 185.0,
            "antecedent_72h_mm": 395.0,
            "cumulative_7d_mm": 580.0
        },
        "environment": {
            "temperature_c": 21.4,
            "relative_humidity_pct": 96.0,
            "pore_water_pressure_kpa": 12.8,
            "soil_moisture_ratio": 0.88,
            "tiltmeter_deg": 0.14
        },
        "historical_landslides": [
            {
                "event_date": datetime(2024, 7, 30, 2, 15),
                "latitude": 11.5390,
                "longitude": 76.1350,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 48000.0,
                "casualties": 24,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 180000.0,
                "rainfall_conditions_mm": 372.0,
                "data_confidence": "HIGH",
                "notes": "Massive catastrophic debris flow along Chooralmala-Mundakkai riverine corridor following torrential burst."
            },
            {
                "event_date": datetime(2022, 8, 8, 14, 30),
                "latitude": 11.5370,
                "longitude": 76.1310,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 22000.0,
                "casualties": 2,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NDMA_SDMA",
                "affected_area_m2": 65000.0,
                "rainfall_conditions_mm": 215.0,
                "data_confidence": "HIGH",
                "notes": "Upper tea estate translational failure breaching local plantation road."
            },
            {
                "event_date": datetime(2020, 8, 6, 9, 0),
                "latitude": 11.5310,
                "longitude": 76.1280,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 18000.0,
                "casualties": 0,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "FIELD_SURVEY",
                "affected_area_m2": 42000.0,
                "rainfall_conditions_mm": 195.0,
                "data_confidence": "HIGH",
                "notes": "Shallow translational slip blocked estate connectivity road."
            },
            {
                "event_date": datetime(2019, 8, 8, 17, 45),
                "latitude": 11.5450,
                "longitude": 76.1390,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 55000.0,
                "casualties": 17,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 195000.0,
                "rainfall_conditions_mm": 320.0,
                "data_confidence": "HIGH",
                "notes": "Puthumala adjacent scarp failure inundating valley settlements."
            },
            {
                "event_date": datetime(2018, 8, 15, 11, 20),
                "latitude": 11.5330,
                "longitude": 76.1250,
                "trigger_type": "CYCLONIC_PRECIPITATION",
                "estimated_volume_m3": 34000.0,
                "casualties": 5,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NASA_GLC",
                "affected_area_m2": 88000.0,
                "rainfall_conditions_mm": 285.0,
                "data_confidence": "HIGH",
                "notes": "Statewide deluge triggering steep slope slippage across Ghat artery."
            }
        ],
        "infrastructures": [
            {"name": "Chooralmala Lifeline Bridge", "asset_type": "BRIDGE", "latitude": 11.5340, "longitude": 76.1310, "lifeline_tier": 1, "capacity": 6500, "exposure_weight": 2.5},
            {"name": "Meppadi Community Health Center", "asset_type": "HOSPITAL", "latitude": 11.5450, "longitude": 76.1250, "lifeline_tier": 1, "capacity": 120, "exposure_weight": 3.0},
            {"name": "Government Higher Secondary School Vellarmala", "asset_type": "SCHOOL", "latitude": 11.5385, "longitude": 76.1330, "lifeline_tier": 1, "capacity": 550, "exposure_weight": 2.0},
            {"name": "Chooralmala 33kV Power Substation", "asset_type": "POWER_SUBSTATION", "latitude": 11.5305, "longitude": 76.1380, "lifeline_tier": 2, "capacity": 15000, "exposure_weight": 1.8},
            {"name": "Mundakkai Settlement Hamlet", "asset_type": "VILLAGE", "latitude": 11.5420, "longitude": 76.1410, "lifeline_tier": 1, "capacity": 3200, "exposure_weight": 2.2}
        ]
    },
    {
        "code": "KL-IDK-02",
        "name": "Munnar - Devikulam Escarpment",
        "taluk": "Devikulam",
        "district": "Idukki",
        "state": "Kerala",
        "latitude": 10.0889,
        "longitude": 77.0595,
        "elevation_m": 1530.0,
        "area_km2": 58.0,
        "population": 22500,
        "boundary_coords": [
            [77.040, 10.105], [77.085, 10.108], [77.090, 10.065],
            [77.045, 10.068], [77.040, 10.105]
        ],
        "terrain": {
            "slope_degrees": 41.0,
            "aspect_degrees": 195.0,
            "elevation_m": 1530.0,
            "profile_curvature": 0.52,
            "plan_curvature": -0.28,
            "twi": 10.2
        },
        "soil": {
            "soil_type": "Skeletal Loam & Lithic Contact",
            "cohesion_kpa": 12.0,
            "friction_angle_deg": 29.0,
            "ksat_mm_hr": 28.0,
            "soil_depth_m": 2.2,
            "bulk_density_kn_m3": 19.0
        },
        "geology": {
            "lithology_class": "Migmatitic Gneiss",
            "weathering_grade": "Moderate",
            "fault_distance_m": 620.0,
            "bedding_dip_deg": 38.0
        },
        "land_cover": {
            "land_cover_type": "Commercial Tea & Steep Road Verge",
            "ndvi_index": 0.52,
            "tree_canopy_pct": 25.0,
            "road_cut_distance_m": 20.0
        },
        "rainfall": {
            "intensity_1h_mm": 18.0,
            "accum_24h_mm": 145.0,
            "antecedent_72h_mm": 290.0,
            "cumulative_7d_mm": 420.0
        },
        "environment": {
            "temperature_c": 17.5,
            "relative_humidity_pct": 94.0,
            "pore_water_pressure_kpa": 9.5,
            "soil_moisture_ratio": 0.79,
            "tiltmeter_deg": 0.08
        },
        "historical_landslides": [
            {
                "event_date": datetime(2024, 8, 12, 16, 10),
                "latitude": 10.0890,
                "longitude": 77.0640,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 14000.0,
                "casualties": 0,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "FIELD_SURVEY",
                "affected_area_m2": 35000.0,
                "rainfall_conditions_mm": 185.0,
                "data_confidence": "HIGH",
                "notes": "Devikulam Gap Road rockfall and colluvial slip obstructing vehicular movement."
            },
            {
                "event_date": datetime(2023, 7, 23, 10, 20),
                "latitude": 10.0840,
                "longitude": 77.0590,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 19000.0,
                "casualties": 1,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "NDMA_SDMA",
                "affected_area_m2": 48000.0,
                "rainfall_conditions_mm": 170.0,
                "data_confidence": "HIGH",
                "notes": "Munnar Valley road cut embankment failure affecting tea plantation workers' quarters."
            },
            {
                "event_date": datetime(2021, 10, 17, 19, 0),
                "latitude": 10.0810,
                "longitude": 77.0670,
                "trigger_type": "CYCLONIC_PRECIPITATION",
                "estimated_volume_m3": 28000.0,
                "casualties": 3,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 72000.0,
                "rainfall_conditions_mm": 240.0,
                "data_confidence": "HIGH",
                "notes": "Post-monsoon low-pressure depression inducing deep circular rotational slip."
            },
            {
                "event_date": datetime(2020, 8, 7, 2, 30),
                "latitude": 10.0820,
                "longitude": 77.0610,
                "trigger_type": "CLOUDBURST",
                "estimated_volume_m3": 62000.0,
                "casualties": 66,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 210000.0,
                "rainfall_conditions_mm": 340.0,
                "data_confidence": "HIGH",
                "notes": "Pettimudi-Rajamala catastrophic debris flow down steep granitic cliff-face into settlement."
            },
            {
                "event_date": datetime(2018, 8, 16, 8, 45),
                "latitude": 10.0780,
                "longitude": 77.0540,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 25000.0,
                "casualties": 4,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NASA_GLC",
                "affected_area_m2": 68000.0,
                "rainfall_conditions_mm": 275.0,
                "data_confidence": "HIGH",
                "notes": "Devikulam Taluk multiple simultaneous slips severing Kochi-Dhanushkodi highway."
            }
        ],
        "infrastructures": [
            {"name": "National Highway 85 (Kochi-Dhanushkodi)", "asset_type": "HIGHWAY", "latitude": 10.0860, "longitude": 77.0580, "lifeline_tier": 1, "capacity": 18000, "exposure_weight": 2.8},
            {"name": "Devikulam Taluk Hospital", "asset_type": "HOSPITAL", "latitude": 10.0750, "longitude": 77.0680, "lifeline_tier": 1, "capacity": 90, "exposure_weight": 2.5},
            {"name": "Munnar Valley High School", "asset_type": "SCHOOL", "latitude": 10.0890, "longitude": 77.0620, "lifeline_tier": 2, "capacity": 420, "exposure_weight": 1.8},
            {"name": "Pallivasal Hydro Intake Pipeline", "asset_type": "POWER_SUBSTATION", "latitude": 10.0710, "longitude": 77.0520, "lifeline_tier": 1, "capacity": 45000, "exposure_weight": 3.0}
        ]
    },
    {
        "code": "UK-CHM-03",
        "name": "Joshimath - Alaknanda Valley Slopes",
        "taluk": "Joshimath",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "latitude": 30.5564,
        "longitude": 79.5670,
        "elevation_m": 1890.0,
        "area_km2": 64.0,
        "population": 18700,
        "boundary_coords": [
            [79.545, 30.575], [79.590, 30.578], [79.595, 30.535],
            [79.550, 30.538], [79.545, 30.575]
        ],
        "terrain": {
            "slope_degrees": 44.5,
            "aspect_degrees": 40.0,
            "elevation_m": 1890.0,
            "profile_curvature": 0.65,
            "plan_curvature": -0.41,
            "twi": 8.9
        },
        "soil": {
            "soil_type": "Glacial Moraine & Coarse Talus",
            "cohesion_kpa": 9.5,
            "friction_angle_deg": 32.0,
            "ksat_mm_hr": 48.0,
            "soil_depth_m": 3.5,
            "bulk_density_kn_m3": 19.5
        },
        "geology": {
            "lithology_class": "Vaikrita Quartz-Mica Schist & Gneiss",
            "weathering_grade": "Heavily Fractured / Active Creep",
            "fault_distance_m": 180.0,
            "bedding_dip_deg": 42.0
        },
        "land_cover": {
            "land_cover_type": "Sub-alpine Scrub & Urban Expansion",
            "ndvi_index": 0.32,
            "tree_canopy_pct": 18.0,
            "road_cut_distance_m": 15.0
        },
        "rainfall": {
            "intensity_1h_mm": 12.0,
            "accum_24h_mm": 78.0,
            "antecedent_72h_mm": 165.0,
            "cumulative_7d_mm": 240.0
        },
        "environment": {
            "temperature_c": 14.2,
            "relative_humidity_pct": 82.0,
            "pore_water_pressure_kpa": 6.2,
            "soil_moisture_ratio": 0.64,
            "tiltmeter_deg": 0.22
        },
        "historical_landslides": [
            {
                "event_date": datetime(2024, 7, 18, 14, 0),
                "latitude": 30.5590,
                "longitude": 79.5690,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 42000.0,
                "casualties": 0,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "FIELD_SURVEY",
                "affected_area_m2": 110000.0,
                "rainfall_conditions_mm": 145.0,
                "data_confidence": "HIGH",
                "notes": "Alaknanda Riverbed toe-cutting slope breach triggering upper scarp tension fissures."
            },
            {
                "event_date": datetime(2023, 1, 5, 22, 15),
                "latitude": 30.5560,
                "longitude": 79.5650,
                "trigger_type": "SEISMIC_AND_HYDRO",
                "estimated_volume_m3": 120000.0,
                "casualties": 0,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 320000.0,
                "rainfall_conditions_mm": 45.0,
                "data_confidence": "HIGH",
                "notes": "Joshimath Town wide-scale moraine subsidence and progressive foundational displacement."
            },
            {
                "event_date": datetime(2023, 7, 20, 8, 30),
                "latitude": 30.5610,
                "longitude": 79.5740,
                "trigger_type": "CLOUDBURST",
                "estimated_volume_m3": 35000.0,
                "casualties": 2,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NDMA_SDMA",
                "affected_area_m2": 95000.0,
                "rainfall_conditions_mm": 160.0,
                "data_confidence": "HIGH",
                "notes": "Marwari scarp collapse damaging electrical transmission lines and pedestrian footbridges."
            },
            {
                "event_date": datetime(2021, 2, 7, 10, 15),
                "latitude": 30.5480,
                "longitude": 79.5820,
                "trigger_type": "GLACIAL_LAKE_OUTBURST",
                "estimated_volume_m3": 85000.0,
                "casualties": 19,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 280000.0,
                "rainfall_conditions_mm": 30.0,
                "data_confidence": "HIGH",
                "notes": "Chamoli high-altitude rock and hanging glacier detachment surging down Dhauliganga/Alaknanda."
            },
            {
                "event_date": datetime(2019, 8, 12, 16, 50),
                "latitude": 30.5530,
                "longitude": 79.5620,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 16000.0,
                "casualties": 0,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "NASA_GLC",
                "affected_area_m2": 38000.0,
                "rainfall_conditions_mm": 135.0,
                "data_confidence": "HIGH",
                "notes": "Badrinath NH-07 pilgrimage corridor cut slope slip blocking convoy movements."
            }
        ],
        "infrastructures": [
            {"name": "National Highway 07 (Badrinath Lifeline)", "asset_type": "HIGHWAY", "latitude": 30.5540, "longitude": 79.5650, "lifeline_tier": 1, "capacity": 25000, "exposure_weight": 3.0},
            {"name": "Joshimath Sub-District Hospital", "asset_type": "HOSPITAL", "latitude": 30.5580, "longitude": 79.5630, "lifeline_tier": 1, "capacity": 80, "exposure_weight": 2.5},
            {"name": "Alaknanda Gorge Lifeline Suspension Bridge", "asset_type": "BRIDGE", "latitude": 30.5510, "longitude": 79.5720, "lifeline_tier": 1, "capacity": 10000, "exposure_weight": 2.8},
            {"name": "Marwari Power Grid Node", "asset_type": "POWER_SUBSTATION", "latitude": 30.5600, "longitude": 79.5750, "lifeline_tier": 2, "capacity": 30000, "exposure_weight": 2.0}
        ]
    },
    {
        "code": "HP-SHM-04",
        "name": "Rampur - Kotropi Highway Corridor",
        "taluk": "Rampur Bushahr",
        "district": "Shimla",
        "state": "Himachal Pradesh",
        "latitude": 31.4485,
        "longitude": 77.6320,
        "elevation_m": 1350.0,
        "area_km2": 50.0,
        "population": 16800,
        "boundary_coords": [
            [77.615, 31.465], [77.655, 31.468], [77.660, 31.425],
            [77.620, 31.428], [77.615, 31.465]
        ],
        "terrain": {
            "slope_degrees": 38.0,
            "aspect_degrees": 315.0,
            "elevation_m": 1350.0,
            "profile_curvature": 0.38,
            "plan_curvature": -0.22,
            "twi": 9.4
        },
        "soil": {
            "soil_type": "Colluvial Silt & Sandstone Scree",
            "cohesion_kpa": 16.0,
            "friction_angle_deg": 30.0,
            "ksat_mm_hr": 24.0,
            "soil_depth_m": 2.5,
            "bulk_density_kn_m3": 18.8
        },
        "geology": {
            "lithology_class": "Jutogh Metamorphic Quartzite",
            "weathering_grade": "Moderate to High",
            "fault_distance_m": 420.0,
            "bedding_dip_deg": 34.0
        },
        "land_cover": {
            "land_cover_type": "Pine Forest & Apple Orchards",
            "ndvi_index": 0.62,
            "tree_canopy_pct": 52.0,
            "road_cut_distance_m": 30.0
        },
        "rainfall": {
            "intensity_1h_mm": 8.5,
            "accum_24h_mm": 54.0,
            "antecedent_72h_mm": 115.0,
            "cumulative_7d_mm": 175.0
        },
        "environment": {
            "temperature_c": 19.8,
            "relative_humidity_pct": 78.0,
            "pore_water_pressure_kpa": 4.5,
            "soil_moisture_ratio": 0.52,
            "tiltmeter_deg": 0.04
        },
        "historical_landslides": [
            {
                "event_date": datetime(2024, 8, 1, 3, 20),
                "latitude": 31.4490,
                "longitude": 77.6380,
                "trigger_type": "CLOUDBURST",
                "estimated_volume_m3": 38000.0,
                "casualties": 4,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NDMA_SDMA",
                "affected_area_m2": 85000.0,
                "rainfall_conditions_mm": 210.0,
                "data_confidence": "HIGH",
                "notes": "Rampur Samej stream flash surge and colluvial toe slide breaching communication corridors."
            },
            {
                "event_date": datetime(2023, 7, 10, 6, 45),
                "latitude": 31.4450,
                "longitude": 77.6350,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 65000.0,
                "casualties": 8,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 190000.0,
                "rainfall_conditions_mm": 290.0,
                "data_confidence": "HIGH",
                "notes": "Sutlej River basin catastrophic road collapse and terrace slip following unprecedented deluge."
            },
            {
                "event_date": datetime(2023, 8, 14, 11, 10),
                "latitude": 31.4420,
                "longitude": 77.6300,
                "trigger_type": "MONSOON_DELUGE",
                "estimated_volume_m3": 48000.0,
                "casualties": 15,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 140000.0,
                "rainfall_conditions_mm": 260.0,
                "data_confidence": "HIGH",
                "notes": "Regional high-relief valley slips impacting roadside hamlets and electrical transmission towers."
            },
            {
                "event_date": datetime(2021, 8, 11, 12, 0),
                "latitude": 31.4530,
                "longitude": 77.6410,
                "trigger_type": "ROCKFALL_AND_SLIP",
                "estimated_volume_m3": 52000.0,
                "casualties": 28,
                "damage_rating": "CATASTROPHIC",
                "severity": "CATASTROPHIC",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 160000.0,
                "rainfall_conditions_mm": 180.0,
                "data_confidence": "HIGH",
                "notes": "Nigulsari-adjacent vertical quartzite cliff-face planar shear detachment hitting highway transit."
            },
            {
                "event_date": datetime(2019, 7, 25, 15, 30),
                "latitude": 31.4410,
                "longitude": 77.6330,
                "trigger_type": "MONSOON_RAINFALL",
                "estimated_volume_m3": 15000.0,
                "casualties": 0,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "FIELD_SURVEY",
                "affected_area_m2": 32000.0,
                "rainfall_conditions_mm": 120.0,
                "data_confidence": "HIGH",
                "notes": "Rampur Bushahr apple terrace slope failure temporarily choking irrigation drainage."
            }
        ],
        "infrastructures": [
            {"name": "National Highway 05 (Hindustan-Tibet Road)", "asset_type": "HIGHWAY", "latitude": 31.4470, "longitude": 77.6310, "lifeline_tier": 1, "capacity": 15000, "exposure_weight": 2.6},
            {"name": "Rampur Civil Hospital", "asset_type": "HOSPITAL", "latitude": 31.4510, "longitude": 77.6280, "lifeline_tier": 1, "capacity": 110, "exposure_weight": 2.4},
            {"name": "Sutlej River Overpass Bridge", "asset_type": "BRIDGE", "latitude": 31.4430, "longitude": 77.6340, "lifeline_tier": 1, "capacity": 8000, "exposure_weight": 2.2}
        ]
    },
    {
        "code": "TN-NIL-05",
        "name": "Coonoor - Kotagiri Ghat Slopes",
        "taluk": "Coonoor",
        "district": "The Nilgiris",
        "state": "Tamil Nadu",
        "latitude": 11.3530,
        "longitude": 76.7959,
        "elevation_m": 1850.0,
        "area_km2": 46.0,
        "population": 21000,
        "boundary_coords": [
            [76.775, 11.370], [76.815, 11.372], [76.820, 11.335],
            [76.780, 11.338], [76.775, 11.370]
        ],
        "terrain": {
            "slope_degrees": 28.5,
            "aspect_degrees": 130.0,
            "elevation_m": 1850.0,
            "profile_curvature": 0.25,
            "plan_curvature": -0.15,
            "twi": 8.2
        },
        "soil": {
            "soil_type": "Deep Lateritic Clay Loam",
            "cohesion_kpa": 22.0,
            "friction_angle_deg": 31.0,
            "ksat_mm_hr": 20.0,
            "soil_depth_m": 3.2,
            "bulk_density_kn_m3": 18.0
        },
        "geology": {
            "lithology_class": "Charnockitic Granulite",
            "weathering_grade": "Fresh to Moderate",
            "fault_distance_m": 850.0,
            "bedding_dip_deg": 24.0
        },
        "land_cover": {
            "land_cover_type": "Montane Shola & Eucalyptus Forest",
            "ndvi_index": 0.74,
            "tree_canopy_pct": 68.0,
            "road_cut_distance_m": 85.0
        },
        "rainfall": {
            "intensity_1h_mm": 3.0,
            "accum_24h_mm": 22.0,
            "antecedent_72h_mm": 48.0,
            "cumulative_7d_mm": 72.0
        },
        "environment": {
            "temperature_c": 16.8,
            "relative_humidity_pct": 72.0,
            "pore_water_pressure_kpa": 1.2,
            "soil_moisture_ratio": 0.38,
            "tiltmeter_deg": 0.01
        },
        "historical_landslides": [
            {
                "event_date": datetime(2024, 11, 14, 18, 30),
                "latitude": 11.3540,
                "longitude": 76.7970,
                "trigger_type": "NORTHEAST_MONSOON",
                "estimated_volume_m3": 26000.0,
                "casualties": 1,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NDMA_SDMA",
                "affected_area_m2": 62000.0,
                "rainfall_conditions_mm": 230.0,
                "data_confidence": "HIGH",
                "notes": "Late northeast monsoon intense cloudburst collapsing Coonoor-Kotagiri Ghat retaining structures."
            },
            {
                "event_date": datetime(2023, 11, 23, 14, 0),
                "latitude": 11.3500,
                "longitude": 76.7940,
                "trigger_type": "NORTHEAST_MONSOON",
                "estimated_volume_m3": 18000.0,
                "casualties": 0,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "FIELD_SURVEY",
                "affected_area_m2": 45000.0,
                "rainfall_conditions_mm": 190.0,
                "data_confidence": "HIGH",
                "notes": "Kotagiri Ghat Road cut slope circular failure leading to temporary single-lane transit restriction."
            },
            {
                "event_date": datetime(2021, 11, 10, 21, 45),
                "latitude": 11.3570,
                "longitude": 76.8020,
                "trigger_type": "CYCLONIC_PRECIPITATION",
                "estimated_volume_m3": 31000.0,
                "casualties": 2,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 78000.0,
                "rainfall_conditions_mm": 250.0,
                "data_confidence": "HIGH",
                "notes": "Marappalam Ridge multiple shallow slips triggered by Arabian Sea & Bay of Bengal dual depression."
            },
            {
                "event_date": datetime(2019, 10, 22, 7, 15),
                "latitude": 11.3510,
                "longitude": 76.7990,
                "trigger_type": "NORTHEAST_MONSOON",
                "estimated_volume_m3": 22000.0,
                "casualties": 0,
                "damage_rating": "MODERATE",
                "severity": "MODERATE",
                "data_source": "GSI_BHUKOSH",
                "affected_area_m2": 52000.0,
                "rainfall_conditions_mm": 180.0,
                "data_confidence": "HIGH",
                "notes": "Nilgiri Mountain Railway embankment washout between Hillgrove and Runnymede."
            },
            {
                "event_date": datetime(2018, 11, 16, 11, 0),
                "latitude": 11.3480,
                "longitude": 76.7910,
                "trigger_type": "CYCLONIC_PRECIPITATION",
                "estimated_volume_m3": 29000.0,
                "casualties": 3,
                "damage_rating": "SEVERE",
                "severity": "SEVERE",
                "data_source": "NASA_GLC",
                "affected_area_m2": 74000.0,
                "rainfall_conditions_mm": 215.0,
                "data_confidence": "HIGH",
                "notes": "Cyclone Gaja moisture vortex triggering planar slip on tea garden escarpment."
            }
        ],
        "infrastructures": [
            {"name": "Nilgiri Mountain Railway Track (UNESCO)", "asset_type": "HIGHWAY", "latitude": 11.3550, "longitude": 76.7930, "lifeline_tier": 1, "capacity": 5000, "exposure_weight": 2.2},
            {"name": "Coonoor Lawley Government Hospital", "asset_type": "HOSPITAL", "latitude": 11.3500, "longitude": 76.7980, "lifeline_tier": 1, "capacity": 140, "exposure_weight": 2.5},
            {"name": "Kotagiri Ghat Bridge 12", "asset_type": "BRIDGE", "latitude": 31.4430, "longitude": 77.6340, "lifeline_tier": 2, "capacity": 6000, "exposure_weight": 1.8}
        ]
    }
]


def seed_demo_data(db: Session, force_reset: bool = False) -> Dict[str, Any]:
    """Seed synthetic demonstration records into the database."""
    if force_reset:
        # Clear existing demo records
        db.query(HistoricalLandslide).filter(HistoricalLandslide.is_demo == True).delete()
        db.query(Infrastructure).filter(Infrastructure.is_demo == True).delete()
        db.query(RainfallObservation).filter(RainfallObservation.is_demo == True).delete()
        db.query(EnvironmentalObservation).filter(EnvironmentalObservation.is_demo == True).delete()
        db.query(LandCoverFeature).delete()
        db.query(GeologyFeature).delete()
        db.query(SoilFeature).delete()
        db.query(TerrainFeature).delete()
        db.query(Location).filter(Location.is_demo == True).delete()
        db.commit()

    # Ensure default users for all 4 operational roles exist
    user_seeds = [
        {
            "username": "admin",
            "email": "ndrf.commander@disaster.gov.in",
            "password": "AdminPass2026!",
            "full_name": "Col. R. K. Sharma (Disaster Ops Commander)",
            "role": "ADMIN"
        },
        {
            "username": "analyst",
            "email": "geotech.analyst@sdrf.gov.in",
            "password": "AnalystPass2026!",
            "full_name": "Dr. Priya Nair (Senior Geotechnical Analyst)",
            "role": "ANALYST"
        },
        {
            "username": "field_officer",
            "email": "field.squad@disaster.gov.in",
            "password": "FieldPass2026!",
            "full_name": "Insp. Arun Kumar (Rapid Response Field Officer)",
            "role": "FIELD_OFFICER"
        },
        {
            "username": "viewer",
            "email": "public.bulletin@disaster.gov.in",
            "password": "ViewerPass2026!",
            "full_name": "Public Observatory (Read-Only Viewer)",
            "role": "READ_ONLY"
        }
    ]

    for u in user_seeds:
        if not db.query(User).filter(User.username == u["username"]).first():
            db.add(User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                is_active=True
            ))
    db.commit()

    # Check if already seeded
    existing_count = db.query(Location).filter(Location.is_demo == True).count()
    if existing_count > 0 and not force_reset:
        # Reconcile and ensure all historical landslides from hotspots are present
        for spot in DEMO_HOTSPOTS:
            loc = db.query(Location).filter(Location.code == spot["code"]).first()
            if loc:
                existing_hl_coords = {(round(h.latitude, 4), round(h.longitude, 4)) for h in loc.historical_landslides}
                for hl in spot.get("historical_landslides", []):
                    coord = (round(hl["latitude"], 4), round(hl["longitude"], 4))
                    if coord not in existing_hl_coords:
                        item = HistoricalLandslide(
                            location_id=loc.id,
                            event_date=hl["event_date"],
                            latitude=hl["latitude"],
                            longitude=hl["longitude"],
                            trigger_type=hl["trigger_type"],
                            estimated_volume_m3=hl.get("estimated_volume_m3"),
                            casualties=hl.get("casualties", 0),
                            damage_rating=hl.get("damage_rating", "MODERATE"),
                            severity=hl.get("severity", hl.get("damage_rating", "MODERATE")),
                            data_source=hl.get("data_source", "GSI_BHUKOSH"),
                            affected_area_m2=hl.get("affected_area_m2", (hl.get("estimated_volume_m3", 10000.0) / 2.5) if hl.get("estimated_volume_m3") else 25000.0),
                            rainfall_conditions_mm=hl.get("rainfall_conditions_mm", 145.0),
                            nearby_infrastructure_json=hl.get("nearby_infrastructure_json", []),
                            data_confidence=hl.get("data_confidence", "HIGH"),
                            notes=hl.get("notes"),
                            is_demo=True
                        )
                        db.add(item)
                        existing_hl_coords.add(coord)
        db.commit()
        return {"status": "ALREADY_SEEDED", "location_count": existing_count}

    # Ensure Data Sources catalog exists
    sources = [
        DataSource(name="DEMO_SYNTHETIC_PROVIDER", provider_type="SYNTHETIC_SIMULATION", is_demo=True),
        DataSource(name="OPEN_METEO_REST_API", provider_type="WEATHER_REST", endpoint_url="https://api.open-meteo.com/v1/forecast", is_demo=False),
        DataSource(name="IMD_AWS_RADAR_STUB", provider_type="RADAR_STATION", is_demo=True),
        DataSource(name="USGS_SRTM_DEM_STUB", provider_type="TERRAIN_ELEVATION", is_demo=True)
    ]
    for s in sources:
        if not db.query(DataSource).filter(DataSource.name == s.name).first():
            db.add(s)
    db.commit()

    # Seed demo locations
    created_locations = []
    for spot in DEMO_HOTSPOTS:
        loc = Location(
            code=spot["code"],
            name=spot["name"],
            taluk=spot["taluk"],
            district=spot["district"],
            state=spot["state"],
            latitude=spot["latitude"],
            longitude=spot["longitude"],
            elevation_m=spot["elevation_m"],
            area_km2=spot["area_km2"],
            population=spot["population"],
            boundary_geojson={
                "type": "Polygon",
                "coordinates": [spot["boundary_coords"]]
            },
            is_demo=True
        )
        db.add(loc)
        db.flush() # Obtain loc.id

        # Terrain
        t = spot["terrain"]
        tf = TerrainFeature(
            location_id=loc.id,
            slope_degrees=t["slope_degrees"],
            aspect_degrees=t["aspect_degrees"],
            elevation_m=t["elevation_m"],
            profile_curvature=t["profile_curvature"],
            plan_curvature=t["plan_curvature"],
            twi=t["twi"],
            source="DEMO_SYNTHETIC"
        )
        db.add(tf)

        # Soil
        s = spot["soil"]
        sf = SoilFeature(
            location_id=loc.id,
            soil_type=s["soil_type"],
            cohesion_kpa=s["cohesion_kpa"],
            friction_angle_deg=s["friction_angle_deg"],
            ksat_mm_hr=s["ksat_mm_hr"],
            soil_depth_m=s["soil_depth_m"],
            bulk_density_kn_m3=s["bulk_density_kn_m3"],
            source="DEMO_SYNTHETIC"
        )
        db.add(sf)

        # Geology
        g = spot["geology"]
        gf = GeologyFeature(
            location_id=loc.id,
            lithology_class=g["lithology_class"],
            weathering_grade=g["weathering_grade"],
            fault_distance_m=g["fault_distance_m"],
            bedding_dip_deg=g["bedding_dip_deg"],
            source="DEMO_SYNTHETIC"
        )
        db.add(gf)

        # Land Cover
        lc = spot["land_cover"]
        lcf = LandCoverFeature(
            location_id=loc.id,
            land_cover_type=lc["land_cover_type"],
            ndvi_index=lc["ndvi_index"],
            tree_canopy_pct=lc["tree_canopy_pct"],
            road_cut_distance_m=lc["road_cut_distance_m"],
            source="DEMO_SYNTHETIC"
        )
        db.add(lcf)

        # Rainfall
        r = spot["rainfall"]
        ro = RainfallObservation(
            location_id=loc.id,
            intensity_1h_mm=r["intensity_1h_mm"],
            accum_24h_mm=r["accum_24h_mm"],
            antecedent_72h_mm=r["antecedent_72h_mm"],
            cumulative_7d_mm=r["cumulative_7d_mm"],
            source="DEMO_SYNTHETIC"
        )
        db.add(ro)

        # Environment
        env = spot["environment"]
        eo = EnvironmentalObservation(
            location_id=loc.id,
            temperature_c=env["temperature_c"],
            relative_humidity_pct=env["relative_humidity_pct"],
            pore_water_pressure_kpa=env["pore_water_pressure_kpa"],
            soil_moisture_ratio=env["soil_moisture_ratio"],
            tiltmeter_deg=env["tiltmeter_deg"],
            source="DEMO_SYNTHETIC"
        )
        db.add(eo)

        # Historical Landslides
        for hl in spot.get("historical_landslides", []):
            item = HistoricalLandslide(
                location_id=loc.id,
                event_date=hl["event_date"],
                latitude=hl["latitude"],
                longitude=hl["longitude"],
                trigger_type=hl["trigger_type"],
                estimated_volume_m3=hl.get("estimated_volume_m3"),
                casualties=hl.get("casualties", 0),
                damage_rating=hl.get("damage_rating", "MODERATE"),
                severity=hl.get("severity", hl.get("damage_rating", "MODERATE")),
                data_source=hl.get("data_source", "GSI_BHUKOSH"),
                affected_area_m2=hl.get("affected_area_m2", (hl.get("estimated_volume_m3", 10000.0) / 2.5) if hl.get("estimated_volume_m3") else 25000.0),
                rainfall_conditions_mm=hl.get("rainfall_conditions_mm", 145.0),
                nearby_infrastructure_json=hl.get("nearby_infrastructure_json", []),
                data_confidence=hl.get("data_confidence", "HIGH"),
                notes=hl.get("notes"),
                is_demo=True
            )
            db.add(item)

        # Infrastructure Assets
        for inf in spot.get("infrastructures", []):
            item = Infrastructure(
                location_id=loc.id,
                name=inf["name"],
                asset_type=inf["asset_type"],
                latitude=inf["latitude"],
                longitude=inf["longitude"],
                lifeline_tier=inf.get("lifeline_tier", 1),
                capacity=inf.get("capacity", 100),
                exposure_weight=inf.get("exposure_weight", 1.0),
                is_demo=True
            )
            db.add(item)

        created_locations.append(loc.name)

    db.commit()

    # Seed initial Data Quality Telemetry
    demo_source = db.query(DataSource).filter(DataSource.name == "DEMO_SYNTHETIC_PROVIDER").first()
    if demo_source:
        dqr = DataQualityRecord(
            source_id=demo_source.id,
            freshness_seconds=45,
            missing_value_rate=0.0,
            coverage_pct=100.0,
            quality_status="HEALTHY",
            diagnostic_message="Synthetic test dataset online and calibrated."
        )
        db.add(dqr)
        db.commit()

    return {
        "status": "SEEDED_SUCCESSFULLY",
        "location_count": len(created_locations),
        "locations": created_locations
    }
