"""Type definitions and schemas for Landslide Data Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Defines normalized geographic envelopes, validation flags, quality statuses,
freshness rules, and provider metadata.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class DataCategory(str, Enum):
    RAINFALL = "RAINFALL"
    TERRAIN = "TERRAIN"
    SOIL = "SOIL"
    LAND_COVER = "LAND_COVER"
    GEOLOGY = "GEOLOGY"
    HISTORICAL_LANDSLIDES = "HISTORICAL_LANDSLIDES"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    ADMIN_BOUNDARIES = "ADMIN_BOUNDARIES"


class DataQualityStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    STALE = "STALE"
    FAILING = "FAILING"
    SUSPICIOUS = "SUSPICIOUS"
    SPIKE = "SPIKE"
    OUT_OF_RANGE = "OUT_OF_RANGE"
    INCOMPLETE = "INCOMPLETE"
    DUPLICATE = "DUPLICATE"


class FreshnessStatus(str, Enum):
    FRESH = "FRESH"
    RECENT = "RECENT"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"


class DatasetType(str, Enum):
    DEMO = "DEMO"
    REAL = "REAL"
    SIMULATION = "SIMULATION"


class ValidationSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class ValidationFlag(BaseModel):
    code: str
    message: str
    severity: ValidationSeverity = ValidationSeverity.WARNING
    field: Optional[str] = None
    raw_value: Optional[Any] = None


class ValidationResult(BaseModel):
    is_valid: bool
    quality_status: DataQualityStatus
    flags: List[ValidationFlag] = []
    clean_data: Optional[Dict[str, Any]] = None
    raw_data: Dict[str, Any] = Field(default_factory=dict)
    message: str = "Validation completed"


class CommonGeographicRecord(BaseModel):
    """Standardized Geographic Feature Envelope for Landslide Risk Modeling."""
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (WGS84)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (WGS84)")
    elevation_m: Optional[float] = Field(None, description="Orthometric elevation above mean sea level in meters")
    region: str = Field(..., description="Catchment, administrative district or sub-basin name")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Observation or measurement timestamp in UTC")
    crs: str = Field(default="EPSG:4326", description="Coordinate reference system identifier")
    category: DataCategory = Field(..., description="Data domain category")
    units: Dict[str, str] = Field(default_factory=dict, description="Explicit unit mapping for all numerical attributes")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Domain-specific normalized geotechnical or environmental attributes")
    dataset_type: DatasetType = Field(default=DatasetType.DEMO, description="Provenance: DEMO, REAL, or SIMULATION")
    source_attribution: str = Field(..., description="Entity or service responsible for data acquisition")
    quality_status: DataQualityStatus = Field(default=DataQualityStatus.HEALTHY, description="Quality indicator after validation pipeline")
    validation_flags: List[ValidationFlag] = Field(default_factory=list, description="Preserved anomaly tags and audit notes")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional provenance or sensor telemetry metadata")


class FreshnessConfig(BaseModel):
    """Configurable freshness thresholds (in seconds) per data category."""
    fresh_threshold_seconds: int = Field(default=3600, description="Under this age is considered FRESH")
    recent_threshold_seconds: int = Field(default=86400, description="Under this age is considered RECENT")
    stale_threshold_seconds: int = Field(default=604800, description="Under this age is considered STALE; older is UNAVAILABLE")


class ProviderMetadata(BaseModel):
    provider_id: str
    name: str
    category: DataCategory
    source_attribution: str
    is_demo: bool
    update_frequency_seconds: int
    coverage_description: str
    contact_or_url: Optional[str] = None
