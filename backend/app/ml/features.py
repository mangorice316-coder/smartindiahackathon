"""Configurable Feature Schema & Metadata Definitions.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Defines continuous, categorical, and derived features, physical bounds,
normal baselines, units, and imputation strategies.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Any, Optional


class FeatureType(str, Enum):
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"


class ImputationStrategy(str, Enum):
    MEDIAN = "median"
    MEAN = "mean"
    MODE = "mode"
    CONSTANT = "constant"


@dataclass
class FeatureSpec:
    name: str
    feature_type: FeatureType
    unit: str
    display_name: str
    description: str
    category: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    default_value: Any = 0.0
    baseline_value: Any = 0.0
    imputation_strategy: ImputationStrategy = ImputationStrategy.MEDIAN
    allowed_categories: Optional[List[str]] = None
    is_required: bool = True


# Comprehensive 26-feature schema specification
FEATURE_SPECIFICATIONS: Dict[str, FeatureSpec] = {
    # 1. Meteorological / Precipitation Features
    "rainfall_1h": FeatureSpec(
        name="rainfall_1h",
        feature_type=FeatureType.NUMERIC,
        unit="mm/h",
        display_name="1-Hour Rainfall Intensity",
        description="Immediate downpour intensity over the past 60 minutes",
        category="meteorological",
        min_value=0.0,
        max_value=300.0,
        default_value=5.0,
        baseline_value=5.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=True
    ),
    "rainfall_3h": FeatureSpec(
        name="rainfall_3h",
        feature_type=FeatureType.NUMERIC,
        unit="mm",
        display_name="3-Hour Accumulated Rainfall",
        description="Accumulated precipitation over past 3 hours",
        category="meteorological",
        min_value=0.0,
        max_value=500.0,
        default_value=15.0,
        baseline_value=15.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "rainfall_6h": FeatureSpec(
        name="rainfall_6h",
        feature_type=FeatureType.NUMERIC,
        unit="mm",
        display_name="6-Hour Accumulated Rainfall",
        description="Accumulated precipitation over past 6 hours",
        category="meteorological",
        min_value=0.0,
        max_value=600.0,
        default_value=25.0,
        baseline_value=25.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "rainfall_12h": FeatureSpec(
        name="rainfall_12h",
        feature_type=FeatureType.NUMERIC,
        unit="mm",
        display_name="12-Hour Accumulated Rainfall",
        description="Accumulated precipitation over past 12 hours",
        category="meteorological",
        min_value=0.0,
        max_value=750.0,
        default_value=40.0,
        baseline_value=40.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "rainfall_24h": FeatureSpec(
        name="rainfall_24h",
        feature_type=FeatureType.NUMERIC,
        unit="mm",
        display_name="24-Hour Accumulated Rainfall",
        description="Daily precipitation accumulation triggering shallow debris flows",
        category="meteorological",
        min_value=0.0,
        max_value=900.0,
        default_value=50.0,
        baseline_value=35.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=True
    ),
    "rainfall_3d": FeatureSpec(
        name="rainfall_3d",
        feature_type=FeatureType.NUMERIC,
        unit="mm",
        display_name="72-Hour Antecedent Rainfall",
        description="3-day antecedent precipitation accumulating pore-water pressure",
        category="meteorological",
        min_value=0.0,
        max_value=1400.0,
        default_value=100.0,
        baseline_value=75.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=True
    ),
    "rainfall_7d": FeatureSpec(
        name="rainfall_7d",
        feature_type=FeatureType.NUMERIC,
        unit="mm",
        display_name="7-Day Cumulative Rainfall",
        description="Weekly cumulative rainfall driving deep-seated rotational slides",
        category="meteorological",
        min_value=0.0,
        max_value=2500.0,
        default_value=160.0,
        baseline_value=120.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),

    # 2. Hydrological Features
    "soil_moisture": FeatureSpec(
        name="soil_moisture",
        feature_type=FeatureType.NUMERIC,
        unit="ratio",
        display_name="Volumetric Soil Moisture Ratio",
        description="Volumetric soil saturation ratio from 0.0 (dry) to 1.0 (fully saturated)",
        category="hydrological",
        min_value=0.0,
        max_value=1.0,
        default_value=0.45,
        baseline_value=0.35,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=True
    ),

    # 3. Topographical Features
    "elevation": FeatureSpec(
        name="elevation",
        feature_type=FeatureType.NUMERIC,
        unit="m",
        display_name="Terrain Elevation",
        description="Meters above mean sea level from DEM",
        category="topographical",
        min_value=-100.0,
        max_value=9000.0,
        default_value=950.0,
        baseline_value=800.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=True
    ),
    "slope": FeatureSpec(
        name="slope",
        feature_type=FeatureType.NUMERIC,
        unit="deg",
        display_name="Slope Angle",
        description="Terrain inclination angle in degrees from Horn DEM algorithm",
        category="topographical",
        min_value=0.0,
        max_value=90.0,
        default_value=28.0,
        baseline_value=18.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=True
    ),
    "aspect": FeatureSpec(
        name="aspect",
        feature_type=FeatureType.NUMERIC,
        unit="deg",
        display_name="Downslope Aspect Azimuth",
        description="Compass direction the slope faces (0 to 360 deg, North=0, East=90)",
        category="topographical",
        min_value=0.0,
        max_value=360.0,
        default_value=180.0,
        baseline_value=180.0,
        imputation_strategy=ImputationStrategy.CONSTANT,
        is_required=False
    ),

    # 4. Geotechnical Soil Properties
    "soil_cohesion_kpa": FeatureSpec(
        name="soil_cohesion_kpa",
        feature_type=FeatureType.NUMERIC,
        unit="kPa",
        display_name="Soil Cohesion",
        description="Effective soil shear cohesion intercept resisting shear failure",
        category="geotechnical",
        min_value=1.0,
        max_value=100.0,
        default_value=20.0,
        baseline_value=25.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "soil_friction_angle_deg": FeatureSpec(
        name="soil_friction_angle_deg",
        feature_type=FeatureType.NUMERIC,
        unit="deg",
        display_name="Internal Friction Angle",
        description="Effective internal friction angle of the soil matrix",
        category="geotechnical",
        min_value=10.0,
        max_value=48.0,
        default_value=30.0,
        baseline_value=32.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "soil_depth_m": FeatureSpec(
        name="soil_depth_m",
        feature_type=FeatureType.NUMERIC,
        unit="m",
        display_name="Regolith Soil Depth",
        description="Depth of overburden soil layer above impermeable bedrock",
        category="geotechnical",
        min_value=0.2,
        max_value=15.0,
        default_value=2.2,
        baseline_value=2.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "soil_permeability_m_s": FeatureSpec(
        name="soil_permeability_m_s",
        feature_type=FeatureType.NUMERIC,
        unit="m/s",
        display_name="Saturated Hydraulic Conductivity",
        description="Rate of water transmission through the saturated regolith",
        category="geotechnical",
        min_value=1e-8,
        max_value=1e-2,
        default_value=1e-5,
        baseline_value=1e-5,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),

    # 5. Land Cover & Vegetation
    "land_cover": FeatureSpec(
        name="land_cover",
        feature_type=FeatureType.CATEGORICAL,
        unit="",
        display_name="Land Cover Class",
        description="Dominant surface vegetative or built-up classification",
        category="land_cover",
        default_value="evergreen_forest",
        baseline_value="evergreen_forest",
        allowed_categories=[
            "evergreen_forest",
            "deciduous_forest",
            "agriculture_plantation",
            "barren_rock",
            "settlement_urban",
            "shrubland",
            "tea_estate"
        ],
        imputation_strategy=ImputationStrategy.CONSTANT,
        is_required=False
    ),
    "ndvi": FeatureSpec(
        name="ndvi",
        feature_type=FeatureType.NUMERIC,
        unit="index",
        display_name="Normalized Difference Vegetation Index",
        description="Satellite vegetation canopy vigor providing root reinforcement",
        category="land_cover",
        min_value=-1.0,
        max_value=1.0,
        default_value=0.62,
        baseline_value=0.70,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "tree_canopy_pct": FeatureSpec(
        name="tree_canopy_pct",
        feature_type=FeatureType.NUMERIC,
        unit="%",
        display_name="Tree Canopy Coverage",
        description="Percentage of rainfall intercepted by vegetative canopy",
        category="land_cover",
        min_value=0.0,
        max_value=100.0,
        default_value=60.0,
        baseline_value=70.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),

    # 6. Drainage & Topographic Wetness
    "drainage_density_km_km2": FeatureSpec(
        name="drainage_density_km_km2",
        feature_type=FeatureType.NUMERIC,
        unit="km/km2",
        display_name="Drainage Network Density",
        description="Length of drainage channels per unit catchment area",
        category="drainage",
        min_value=0.0,
        max_value=15.0,
        default_value=2.1,
        baseline_value=1.8,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "distance_to_stream_m": FeatureSpec(
        name="distance_to_stream_m",
        feature_type=FeatureType.NUMERIC,
        unit="m",
        display_name="Distance to Active Stream",
        description="Proximity to natural drainage channels causing toe erosion",
        category="drainage",
        min_value=0.0,
        max_value=5000.0,
        default_value=220.0,
        baseline_value=400.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "twi": FeatureSpec(
        name="twi",
        feature_type=FeatureType.NUMERIC,
        unit="index",
        display_name="Topographic Wetness Index",
        description="ln(a / tan(beta)) topographic flow accumulation indicator",
        category="drainage",
        min_value=1.0,
        max_value=25.0,
        default_value=7.2,
        baseline_value=6.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),

    # 7. Geological Characteristics
    "lithology": FeatureSpec(
        name="lithology",
        feature_type=FeatureType.CATEGORICAL,
        unit="",
        display_name="Bedrock Lithology",
        description="Geological formation and rock composition",
        category="geology",
        default_value="gneiss_schist",
        baseline_value="granite",
        allowed_categories=[
            "gneiss_schist",
            "sandstone_shale",
            "granite",
            "basalt",
            "limestone",
            "alluvium"
        ],
        imputation_strategy=ImputationStrategy.CONSTANT,
        is_required=False
    ),
    "weathering_grade": FeatureSpec(
        name="weathering_grade",
        feature_type=FeatureType.CATEGORICAL,
        unit="",
        display_name="Rock Mass Weathering Grade",
        description="ISRM Grade I (Fresh) to Grade VI (Residual Soil)",
        category="geology",
        default_value="moderately_weathered",
        baseline_value="fresh",
        allowed_categories=[
            "fresh",
            "slightly_weathered",
            "moderately_weathered",
            "highly_weathered",
            "completely_weathered",
            "residual_soil"
        ],
        imputation_strategy=ImputationStrategy.CONSTANT,
        is_required=False
    ),
    "fault_distance_m": FeatureSpec(
        name="fault_distance_m",
        feature_type=FeatureType.NUMERIC,
        unit="m",
        display_name="Distance to Tectonic Fault / Lineament",
        description="Distance to regional structural fault or shear zone",
        category="geology",
        min_value=0.0,
        max_value=50000.0,
        default_value=1800.0,
        baseline_value=4000.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "bedding_dip_deg": FeatureSpec(
        name="bedding_dip_deg",
        feature_type=FeatureType.NUMERIC,
        unit="deg",
        display_name="Structural Bedding Dip Angle",
        description="Inclination of geological bedding planes or schistosity",
        category="geology",
        min_value=0.0,
        max_value=90.0,
        default_value=25.0,
        baseline_value=15.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),

    # 8. Historical & Spatial Memory Features
    "historical_landslide_density": FeatureSpec(
        name="historical_landslide_density",
        feature_type=FeatureType.NUMERIC,
        unit="events/km2",
        display_name="Historical Landslide Density",
        description="Number of documented past landslide initiation scars per sq km",
        category="historical",
        min_value=0.0,
        max_value=50.0,
        default_value=1.5,
        baseline_value=0.5,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
    "distance_to_previous_landslide": FeatureSpec(
        name="distance_to_previous_landslide",
        feature_type=FeatureType.NUMERIC,
        unit="m",
        display_name="Distance to Nearest Historical Scar",
        description="Proximity in meters to nearest documented landslide boundary",
        category="historical",
        min_value=0.0,
        max_value=25000.0,
        default_value=650.0,
        baseline_value=1500.0,
        imputation_strategy=ImputationStrategy.MEDIAN,
        is_required=False
    ),
}

CORE_FEATURE_NAMES = list(FEATURE_SPECIFICATIONS.keys())
NUMERIC_FEATURES = [k for k, v in FEATURE_SPECIFICATIONS.items() if v.feature_type == FeatureType.NUMERIC]
CATEGORICAL_FEATURES = [k for k, v in FEATURE_SPECIFICATIONS.items() if v.feature_type == FeatureType.CATEGORICAL]
REQUIRED_FEATURES = [k for k, v in FEATURE_SPECIFICATIONS.items() if v.is_required]
