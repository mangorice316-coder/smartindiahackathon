"""Landslide Data Engine Package.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides a unified architecture for acquiring, validating, transforming,
storing, and serving environmental and geospatial features.
"""
from app.data_engine.types import (
    CommonGeographicRecord,
    DataCategory,
    DataQualityStatus,
    FreshnessStatus,
    DatasetType,
    ValidationSeverity,
    ValidationFlag,
    ValidationResult,
    FreshnessConfig,
    ProviderMetadata,
)
from app.data_engine.normalization.units import (
    convert_units,
    meters_to_km,
    km_to_meters,
    deg_to_rad,
    rad_to_deg,
    mm_to_meters,
    meters_to_mm,
    hourly_rate_to_daily_accum,
    daily_accum_to_avg_hourly_intensity,
)
from app.data_engine.normalization.crs import (
    validate_coordinates,
    wgs84_to_web_mercator,
    web_mercator_to_wgs84,
)
from app.data_engine.normalization.normalizer import normalize_record
from app.data_engine.validation.validator import DataValidator, PHYSICAL_BOUNDS
from app.data_engine.providers.base import BaseDataProvider
from app.data_engine.providers.interfaces import (
    RainfallProvider,
    TerrainProvider,
    SoilProvider,
    LandCoverProvider,
    GeologyProvider,
    HistoricalLandslideProvider,
    InfrastructureProvider,
)
from app.data_engine.providers.demo_providers import (
    DemoRainfallProvider,
    DemoTerrainProvider,
    DemoSoilProvider,
    DemoLandCoverProvider,
    DemoGeologyProvider,
    DemoHistoricalLandslideProvider,
    DemoInfrastructureProvider,
)
from app.data_engine.providers.remote_providers import OpenMeteoRainfallProvider
from app.data_engine.rainfall.rolling import calculate_rolling_rainfall, DEFAULT_ROLLING_WINDOWS
from app.data_engine.terrain.raster_processor import calculate_slope_and_aspect_horn
from app.data_engine.geospatial.spatial_proximity import (
    haversine_distance_meters,
    haversine_distance_km,
    calculate_infrastructure_proximity,
    REQUIRED_ASSET_TYPES,
)
from app.data_engine.freshness.freshness_checker import FreshnessChecker, DEFAULT_CATEGORY_FRESHNESS
from app.data_engine.cache.ttl_cache import TTLCache, global_cache
from app.data_engine.demo.generator import DemoDatasetGenerator

__all__ = [
    "CommonGeographicRecord",
    "DataCategory",
    "DataQualityStatus",
    "FreshnessStatus",
    "DatasetType",
    "ValidationSeverity",
    "ValidationFlag",
    "ValidationResult",
    "FreshnessConfig",
    "ProviderMetadata",
    "convert_units",
    "meters_to_km",
    "km_to_meters",
    "deg_to_rad",
    "rad_to_deg",
    "mm_to_meters",
    "meters_to_mm",
    "hourly_rate_to_daily_accum",
    "daily_accum_to_avg_hourly_intensity",
    "validate_coordinates",
    "wgs84_to_web_mercator",
    "web_mercator_to_wgs84",
    "normalize_record",
    "DataValidator",
    "PHYSICAL_BOUNDS",
    "BaseDataProvider",
    "RainfallProvider",
    "TerrainProvider",
    "SoilProvider",
    "LandCoverProvider",
    "GeologyProvider",
    "HistoricalLandslideProvider",
    "InfrastructureProvider",
    "DemoRainfallProvider",
    "DemoTerrainProvider",
    "DemoSoilProvider",
    "DemoLandCoverProvider",
    "DemoGeologyProvider",
    "DemoHistoricalLandslideProvider",
    "DemoInfrastructureProvider",
    "OpenMeteoRainfallProvider",
    "calculate_rolling_rainfall",
    "DEFAULT_ROLLING_WINDOWS",
    "calculate_slope_and_aspect_horn",
    "haversine_distance_meters",
    "haversine_distance_km",
    "calculate_infrastructure_proximity",
    "REQUIRED_ASSET_TYPES",
    "FreshnessChecker",
    "DEFAULT_CATEGORY_FRESHNESS",
    "TTLCache",
    "global_cache",
    "DemoDatasetGenerator",
]
