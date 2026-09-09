"""Normalized Relational Database Entities.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Strict separation of Hazard, Exposure, Vulnerability, Models, Data Sources, and Audit Records.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class RiskCategoryEnum(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertSeverityEnum(str, enum.Enum):
    ADVISORY = "ADVISORY"
    WATCH = "WATCH"
    WARNING = "WARNING"
    EVACUATION = "EVACUATION"


class AlertStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class InspectionStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    INSPECTED = "INSPECTED"
    CLEARED = "CLEARED"


class UrgencyTierEnum(str, enum.Enum):
    P1_IMMEDIATE = "P1_IMMEDIATE"
    P2_HIGH = "P2_HIGH"
    P3_MEDIUM = "P3_MEDIUM"
    P4_LOW = "P4_LOW"


class UserRoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    FIELD_OFFICER = "FIELD_OFFICER"
    READ_ONLY = "READ_ONLY"
    PUBLIC_VIEWER = "PUBLIC_VIEWER"


class DataQualityStatusEnum(str, enum.Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    STALE = "STALE"
    FAILING = "FAILING"


# 1. Location Entity
class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    taluk = Column(String(100), nullable=True)
    district = Column(String(100), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    country = Column(String(100), default="India")
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)
    area_km2 = Column(Float, nullable=True)
    population = Column(Integer, default=0)
    
    # Boundary GeoJSON (Polygon / MultiPolygon)
    boundary_geojson = Column(JSON, nullable=True)
    
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    terrain_feature = relationship("TerrainFeature", back_populates="location", uselist=False, cascade="all, delete-orphan")
    soil_feature = relationship("SoilFeature", back_populates="location", uselist=False, cascade="all, delete-orphan")
    geology_feature = relationship("GeologyFeature", back_populates="location", uselist=False, cascade="all, delete-orphan")
    land_cover_feature = relationship("LandCoverFeature", back_populates="location", uselist=False, cascade="all, delete-orphan")
    
    environmental_observations = relationship("EnvironmentalObservation", back_populates="location", cascade="all, delete-orphan")
    rainfall_observations = relationship("RainfallObservation", back_populates="location", cascade="all, delete-orphan")
    historical_landslides = relationship("HistoricalLandslide", back_populates="location", cascade="all, delete-orphan")
    infrastructures = relationship("Infrastructure", back_populates="location", cascade="all, delete-orphan")
    
    risk_assessments = relationship("RiskAssessment", back_populates="location", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="location", cascade="all, delete-orphan")
    inspection_tasks = relationship("InspectionTask", back_populates="location", cascade="all, delete-orphan")
    predictions = relationship("ModelPrediction", back_populates="location", cascade="all, delete-orphan")


# 2. Terrain Feature Entity
class TerrainFeature(Base):
    __tablename__ = "terrain_features"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    slope_degrees = Column(Float, nullable=False)          # beta
    aspect_degrees = Column(Float, nullable=True)          # Compass direction
    elevation_m = Column(Float, nullable=False)
    profile_curvature = Column(Float, default=0.0)         # Downslope acceleration
    plan_curvature = Column(Float, default=0.0)            # Lateral flow divergence
    twi = Column(Float, nullable=False)                     # Topographic Wetness Index ln(a/tan beta)
    
    source = Column(String(100), default="DEMO_SYNTHETIC")
    updated_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="terrain_feature")


# 3. Soil Feature Entity
class SoilFeature(Base):
    __tablename__ = "soil_features"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    soil_type = Column(String(100), nullable=False)         # e.g., Laterite, Colluvium, Clay Loam
    cohesion_kpa = Column(Float, nullable=False)           # c' (effective cohesion)
    friction_angle_deg = Column(Float, nullable=False)     # phi' (effective angle of internal friction)
    ksat_mm_hr = Column(Float, nullable=False)             # Saturated hydraulic conductivity
    soil_depth_m = Column(Float, nullable=False)           # z (depth to shear plane)
    bulk_density_kn_m3 = Column(Float, default=18.5)       # gamma (total soil unit weight)
    permeability_class = Column(String(50), default="MODERATE")
    
    source = Column(String(100), default="DEMO_SYNTHETIC")
    updated_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="soil_feature")


# 4. Geology Feature Entity
class GeologyFeature(Base):
    __tablename__ = "geology_features"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    lithology_class = Column(String(100), nullable=False)  # Gneiss, Schist, Quartzite, Sandstone
    weathering_grade = Column(String(50), default="MODERATE") # Fresh, Moderate, Highly Weathered
    fault_distance_m = Column(Float, nullable=False)       # Distance to known tectonic fault line
    bedding_dip_deg = Column(Float, default=0.0)           # Geological bedding dip angle
    joint_spacing_m = Column(Float, default=1.0)
    
    source = Column(String(100), default="DEMO_SYNTHETIC")
    updated_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="geology_feature")


# 5. Land Cover Feature Entity
class LandCoverFeature(Base):
    __tablename__ = "land_cover_features"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    land_cover_type = Column(String(100), nullable=False)  # Evergreen Forest, Plantation, Agriculture, Urban
    ndvi_index = Column(Float, nullable=False)             # -1.0 to 1.0 (Vegetation vigor)
    tree_canopy_pct = Column(Float, default=50.0)          # Canopy density percentage
    road_cut_distance_m = Column(Float, nullable=False)    # Proximity to man-made slope cuts
    drainage_density_km_km2 = Column(Float, default=1.5)
    
    source = Column(String(100), default="DEMO_SYNTHETIC")
    updated_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="land_cover_feature")


# 6. Environmental Observation Entity
class EnvironmentalObservation(Base):
    __tablename__ = "environmental_observations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    
    temperature_c = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=True)
    pore_water_pressure_kpa = Column(Float, default=0.0)
    soil_moisture_ratio = Column(Float, nullable=False)    # 0.0 to 1.0 (volumetric saturation)
    tiltmeter_deg = Column(Float, default=0.0)             # Sub-surface creep indicator
    
    is_demo = Column(Boolean, default=True)
    source = Column(String(100), default="DEMO_SYNTHETIC")

    location = relationship("Location", back_populates="environmental_observations")


# 7. Rainfall Observation Entity
class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    
    intensity_1h_mm = Column(Float, nullable=False)        # mm/h
    accum_24h_mm = Column(Float, nullable=False)           # 24-hr daily accumulation
    antecedent_72h_mm = Column(Float, nullable=False)      # 3-day antecedent rainfall
    cumulative_7d_mm = Column(Float, nullable=False)       # 7-day cumulative rainfall
    
    is_demo = Column(Boolean, default=True)
    source = Column(String(100), default="DEMO_SYNTHETIC") # "DEMO_SYNTHETIC" or "OPEN_METEO"

    location = relationship("Location", back_populates="rainfall_observations")


# 8. Historical Landslide Entity
class HistoricalLandslide(Base):
    __tablename__ = "historical_landslides"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_date = Column(DateTime, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    trigger_type = Column(String(100), default="MONSOON_RAINFALL") # MONSOON_RAINFALL, CLOUDBURST, SEISMIC
    estimated_volume_m3 = Column(Float, nullable=True)
    casualties = Column(Integer, default=0)
    damage_rating = Column(String(50), default="MODERATE") # MINOR, MODERATE, SEVERE, CATASTROPHIC
    severity = Column(String(50), default="MODERATE")      # MINOR, MODERATE, SEVERE, CATASTROPHIC
    data_source = Column(String(100), default="GSI_BHUKOSH") # GSI_BHUKOSH, NASA_GLC, NDMA_SDMA, FIELD_SURVEY
    affected_area_m2 = Column(Float, nullable=True)
    rainfall_conditions_mm = Column(Float, nullable=True)  # 24-hr antecedent rainfall
    nearby_infrastructure_json = Column(JSON, nullable=True) # list of nearby lifelines
    data_confidence = Column(String(50), default="HIGH")   # HIGH, MEDIUM, LOW
    notes = Column(Text, nullable=True)
    
    is_demo = Column(Boolean, default=True)

    location = relationship("Location", back_populates="historical_landslides")


# 9. Infrastructure Entity
class Infrastructure(Base):
    __tablename__ = "infrastructures"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(150), nullable=False)
    asset_type = Column(String(100), nullable=False, index=True) # HIGHWAY, BRIDGE, HOSPITAL, SCHOOL, POWER_SUBSTATION, VILLAGE
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    lifeline_tier = Column(Integer, default=1)              # 1 = Critical Emergency Lifeline, 2 = Secondary, 3 = Local
    capacity = Column(Integer, default=0)                  # e.g., Bed count or population served
    exposure_weight = Column(Float, default=1.0)           # Multiplier for vulnerability scoring
    
    is_demo = Column(Boolean, default=True)

    location = relationship("Location", back_populates="infrastructures")
    inspection_tasks = relationship("InspectionTask", back_populates="infrastructure")


# 10. Risk Assessment Entity
class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    
    hazard_score = Column(Float, nullable=False)           # 0 - 100 (Physical slope failure probability)
    exposure_score = Column(Float, nullable=False)         # 0 - 100 (Assets & lives in path)
    vulnerability_score = Column(Float, default=50.0)      # 0 - 100
    overall_risk_score = Column(Float, nullable=False, index=True) # 0 - 100
    
    risk_category = Column(String(50), nullable=False)     # LOW, MODERATE, HIGH, CRITICAL
    geotechnical_fs = Column(Float, nullable=False)        # Factor of Safety (Fs)
    model_confidence = Column(Float, nullable=False)       # 0.0 - 1.0
    
    model_version_tag = Column(String(100), nullable=False)
    explanation_json = Column(JSON, nullable=False)        # XAI: Top contributing factors + attribution
    
    is_simulation = Column(Boolean, default=False)
    simulation_scenario_name = Column(String(100), nullable=True)
    is_demo = Column(Boolean, default=True)

    location = relationship("Location", back_populates="risk_assessments")


# 11. Alert Entity
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=True) # e.g. ALT-2026-0001
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(50), default="HIGH", index=True) # LOW, MODERATE, HIGH, CRITICAL
    severity = Column(String(50), nullable=False, index=True) # ADVISORY, WATCH, WARNING, EVACUATION
    priority = Column(String(50), default="HIGH", index=True) # CRITICAL, HIGH, MEDIUM, LOW (Operational urgency)
    trigger_condition = Column(String(255), nullable=False)
    
    data_sources_json = Column(JSON, nullable=True) # ["IMD_RADAR", "AWS_PRECIP", "CARTODEM"]
    model_version = Column(String(100), default="v1.2.0-gradient-boosting")
    affected_infrastructure_json = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=False)
    
    status = Column(String(50), default="ACTIVE", index=True) # GENERATED, ACTIVE, ACKNOWLEDGED, ASSIGNED, UNDER_INSPECTION, RESOLVED, CLOSED
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    assigned_to = Column(String(100), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    escalation_count = Column(Integer, default=0)
    last_escalated_at = Column(DateTime, nullable=True)
    
    is_demo = Column(Boolean, default=True)

    location = relationship("Location", back_populates="alerts")


# 12. Simulation Entity
class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    rainfall_multiplier = Column(Float, default=1.0)       # e.g., 1.25, 1.50, 2.00
    additional_rainfall_mm = Column(Float, default=0.0)    # e.g., +100mm
    duration_hours = Column(Integer, default=24)
    soil_saturation_factor = Column(Float, default=0.8)
    
    results_summary_json = Column(JSON, nullable=False)    # Deltas, newly breached zones, affected infra
    executed_by_user = Column(String(100), default="SYSTEM_ANALYST")
    is_demo = Column(Boolean, default=True)


# 13. Inspection Task Entity
class InspectionTask(Base):
    __tablename__ = "inspection_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True, nullable=True) # e.g. INSP-2026-0001
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    infrastructure_id = Column(Integer, ForeignKey("infrastructures.id", ondelete="SET NULL"), nullable=True)
    
    priority_score = Column(Float, nullable=False, index=True) # 0 - 100
    urgency_tier = Column(String(50), nullable=False)       # P1_IMMEDIATE, P2_HIGH, P3_MEDIUM, P4_LOW
    risk_score = Column(Float, default=50.0)
    
    assigned_team = Column(String(100), nullable=True)
    assigned_officer = Column(String(100), nullable=True)
    deadline = Column(DateTime, nullable=True)
    
    status = Column(String(50), default="PENDING", index=True) # PENDING, DISPATCHED, INSPECTED, CLEARED, CLOSED
    
    rationale = Column(Text, nullable=False)
    contributing_factors_json = Column(JSON, nullable=True)
    affected_infrastructure_json = Column(JSON, nullable=True)
    priority_breakdown_json = Column(JSON, nullable=True)
    evidence_attachments_json = Column(JSON, nullable=True)
    field_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    location = relationship("Location", back_populates="inspection_tasks")
    infrastructure = relationship("Infrastructure", back_populates="inspection_tasks")


# 14. Model Version Entity
class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(100), unique=True, nullable=False)
    algorithm = Column(String(100), nullable=False)        # Random Forest, Gradient Boosting
    training_timestamp = Column(DateTime, default=datetime.utcnow)
    dataset_version = Column(String(100), nullable=False)
    
    accuracy = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    sample_count = Column(Integer, nullable=False)
    
    hyperparameters_json = Column(JSON, nullable=True)
    feature_names_json = Column(JSON, nullable=False)
    feature_importances_json = Column(JSON, nullable=False)
    checksum_sha256 = Column(String(64), nullable=True)
    
    is_active = Column(Boolean, default=False)
    is_synthetic = Column(Boolean, default=True)           # Explicit disclaimer flag


# 15. Model Prediction Entity (Traceability)
class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_version_tag = Column(String(100), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    feature_vector_json = Column(JSON, nullable=False)
    predicted_probability = Column(Float, nullable=False)
    hazard_score = Column(Float, nullable=False)
    explanation_json = Column(JSON, nullable=False)
    
    is_demo = Column(Boolean, default=True)

    location = relationship("Location", back_populates="predictions")


# 16. Data Source Entity
class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    provider_type = Column(String(100), nullable=False)    # WEATHER, TERRAIN, SOIL, SATELLITE, HISTORICAL
    endpoint_url = Column(String(255), nullable=True)
    update_frequency_minutes = Column(Integer, default=60)
    is_demo = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    quality_records = relationship("DataQualityRecord", back_populates="data_source", cascade="all, delete-orphan")


# 17. Data Quality Record Entity
class DataQualityRecord(Base):
    __tablename__ = "data_quality_records"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    freshness_seconds = Column(Integer, nullable=False)
    missing_value_rate = Column(Float, default=0.0)        # 0.0 to 1.0
    coverage_pct = Column(Float, default=100.0)            # 0 to 100%
    quality_status = Column(String(50), default="HEALTHY") # HEALTHY, DEGRADED, STALE, FAILING
    diagnostic_message = Column(String(255), nullable=True)

    data_source = relationship("DataSource", back_populates="quality_records")


# 18. Audit Event Entity
class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_name = Column(String(100), default="ANONYMOUS", index=True)
    action_type = Column(String(100), nullable=False, index=True) # e.g. RUN_SIMULATION, ACKNOWLEDGE_ALERT, RETRAIN_MODEL
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    client_ip = Column(String(50), nullable=True)
    payload_summary = Column(JSON, nullable=True)


# 19. User Entity
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="ANALYST")           # ADMIN, ANALYST, FIELD_OFFICER, PUBLIC_VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
