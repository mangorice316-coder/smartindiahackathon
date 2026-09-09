"""Pydantic v2 Request & Response Schemas.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# --- Authentication & User Schemas ---
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "ANALYST"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# --- Geospatial & Feature Schemas ---
class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[Any]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[Union[int, str]] = None
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


# --- Terrain, Soil, Geology, Land Cover ---
class TerrainFeatureSchema(BaseModel):
    slope_degrees: float
    aspect_degrees: Optional[float] = None
    elevation_m: float
    profile_curvature: float = 0.0
    plan_curvature: float = 0.0
    twi: float
    source: str = "DEMO_SYNTHETIC"

    model_config = ConfigDict(from_attributes=True)


class SoilFeatureSchema(BaseModel):
    soil_type: str
    cohesion_kpa: float
    friction_angle_deg: float
    ksat_mm_hr: float
    soil_depth_m: float
    bulk_density_kn_m3: float = 18.5
    source: str = "DEMO_SYNTHETIC"

    model_config = ConfigDict(from_attributes=True)


class GeologyFeatureSchema(BaseModel):
    lithology_class: str
    weathering_grade: str
    fault_distance_m: float
    bedding_dip_deg: float = 0.0
    source: str = "DEMO_SYNTHETIC"

    model_config = ConfigDict(from_attributes=True)


class LandCoverFeatureSchema(BaseModel):
    land_cover_type: str
    ndvi_index: float
    tree_canopy_pct: float
    road_cut_distance_m: float
    source: str = "DEMO_SYNTHETIC"

    model_config = ConfigDict(from_attributes=True)


# --- Observations ---
class EnvironmentalObservationSchema(BaseModel):
    timestamp: datetime
    temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    pore_water_pressure_kpa: float = 0.0
    soil_moisture_ratio: float
    tiltmeter_deg: float = 0.0
    source: str = "DEMO_SYNTHETIC"

    model_config = ConfigDict(from_attributes=True)


class RainfallObservationSchema(BaseModel):
    timestamp: datetime
    intensity_1h_mm: float = Field(..., ge=0.0, le=1500.0, description="1h intensity in mm (0 to 1500)")
    accum_24h_mm: float = Field(..., ge=0.0, le=3000.0, description="24h accumulation in mm (0 to 3000)")
    antecedent_72h_mm: float = Field(..., ge=0.0, le=5000.0, description="72h antecedent rainfall in mm (0 to 5000)")
    cumulative_7d_mm: float = Field(..., ge=0.0, le=10000.0, description="7d cumulative rainfall in mm (0 to 10000)")
    source: str = "DEMO_SYNTHETIC"

    model_config = ConfigDict(from_attributes=True)


# --- Infrastructure & Historical ---
class InfrastructureSchema(BaseModel):
    id: int
    name: str
    asset_type: str
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    lifeline_tier: int
    capacity: int
    exposure_weight: float
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class HistoricalLandslideSchema(BaseModel):
    id: int
    event_date: datetime
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    trigger_type: str
    estimated_volume_m3: Optional[float] = None
    casualties: int
    damage_rating: str
    notes: Optional[str] = None
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


# --- Location ---
class LocationSummary(BaseModel):
    id: int
    code: str
    name: str
    district: str
    state: str
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    elevation_m: Optional[float] = None
    population: int = Field(default=0, ge=0)
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class LocationDetail(LocationSummary):
    taluk: Optional[str] = None
    area_km2: Optional[float] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    terrain_feature: Optional[TerrainFeatureSchema] = None
    soil_feature: Optional[SoilFeatureSchema] = None
    geology_feature: Optional[GeologyFeatureSchema] = None
    land_cover_feature: Optional[LandCoverFeatureSchema] = None
    latest_rainfall: Optional[RainfallObservationSchema] = None
    latest_environment: Optional[EnvironmentalObservationSchema] = None
    infrastructures: List[InfrastructureSchema] = []
    historical_landslides: List[HistoricalLandslideSchema] = []

    model_config = ConfigDict(from_attributes=True)


# --- Explainable AI & Risk ---
class ContributingFactor(BaseModel):
    factor_name: str
    display_name: str
    value: Any
    unit: str
    contribution_score: float # 0 - 100 relative impact
    direction: str            # "INCREASES_RISK" or "DECREASES_RISK"
    description: str


class RiskExplanation(BaseModel):
    top_factors: List[ContributingFactor]
    geotechnical_narrative: str
    ml_confidence_narrative: str
    data_freshness_status: str
    missing_data_warnings: List[str] = []


class RiskAssessmentResponse(BaseModel):
    id: Optional[int] = None
    location_id: int
    location_name: str
    district: str
    timestamp: datetime
    
    hazard_score: float = Field(..., ge=0.0, le=100.0, description="Hazard score (0-100)")
    exposure_score: float = Field(..., ge=0.0, le=100.0, description="Exposure score (0-100)")
    overall_risk_score: float = Field(..., ge=0.0, le=100.0, description="Overall risk score (0-100)")
    risk_category: str         # LOW, MODERATE, HIGH, CRITICAL
    
    geotechnical_fs: float     # Factor of Safety
    geotechnical_stability: str # STABLE, MARGINAL, UNSTABLE
    model_confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    
    model_version_tag: str
    explanation: RiskExplanation
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


# --- Alerts ---
class AlertResponse(BaseModel):
    id: int
    alert_code: Optional[str] = None
    location_id: int
    location_name: str
    district: str
    timestamp: datetime
    risk_score: float
    risk_category: str = "HIGH"
    severity: str
    priority: str = "HIGH"
    trigger_condition: str
    data_sources: List[str] = []
    model_version: Optional[str] = None
    affected_infrastructure: List[Dict[str, Any]] = []
    recommended_action: str
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    escalation_count: int = 0
    is_demo: bool = True

    model_config = ConfigDict(from_attributes=True)


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str
    action_notes: Optional[str] = None


class AlertAssignRequest(BaseModel):
    assigned_to: str
    assigned_by: Optional[str] = "COMMANDER"
    instructions: Optional[str] = None


class AlertStatusUpdateRequest(BaseModel):
    status: str
    user_name: str = "DUTY_OFFICER"
    resolution_notes: Optional[str] = None


class AlertTriggerConfigSchema(BaseModel):
    critical_risk_score_threshold: float = 70.0
    high_risk_score_threshold: float = 50.0
    risk_surge_delta_threshold: float = 12.0
    rapid_rainfall_intensity_threshold: float = 25.0
    rainfall_24h_accumulation_threshold: float = 100.0
    rainfall_72h_accumulation_threshold: float = 200.0
    cooldown_window_minutes: int = 60


# --- Inspections ---
class InspectionTaskResponse(BaseModel):
    id: int
    task_code: Optional[str] = None
    location_id: int
    location_name: str
    district: str
    infrastructure_id: Optional[int] = None
    infrastructure_name: Optional[str] = None
    priority_score: float
    urgency_tier: str
    risk_score: float = 50.0
    assigned_team: Optional[str] = None
    assigned_officer: Optional[str] = None
    deadline: Optional[datetime] = None
    status: str
    rationale: str
    contributing_factors: List[Dict[str, Any]] = []
    affected_infrastructure: List[Dict[str, Any]] = []
    priority_breakdown: Optional[Dict[str, float]] = None
    evidence_attachments: List[Dict[str, Any]] = []
    field_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InspectionCreateRequest(BaseModel):
    location_id: int
    infrastructure_id: Optional[int] = None
    reason: Optional[str] = None
    assigned_officer: Optional[str] = None
    assigned_team: Optional[str] = None
    deadline_hours: Optional[int] = 12
    notes: Optional[str] = None


class InspectionUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_team: Optional[str] = None
    assigned_officer: Optional[str] = None
    field_notes: Optional[str] = None


class InspectionEvidenceRequest(BaseModel):
    inspector_name: str
    crack_displacement_mm: Optional[float] = None
    observed_creep_severity: Optional[str] = "MODERATE"
    seepage_observed: Optional[bool] = False
    evidence_notes: str
    photo_reference_ids: List[str] = []


# --- Simulation ---
class SimulationRequest(BaseModel):
    scenario_name: str = "Monsoon Deluge Scenario (+150% Rainfall)"
    rainfall_multiplier: float = Field(default=1.5, ge=0.5, le=4.0, description="Multiplier against 24h & 72h rainfall")
    additional_rainfall_mm: float = Field(default=0.0, ge=0.0, le=500.0, description="Absolute rainfall delta in mm")
    duration_hours: int = Field(default=24, ge=1, le=168)
    saturation_override: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Optional soil saturation override")


class SimulationLocationResult(BaseModel):
    location_id: int
    location_name: str
    district: str = "Unknown"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    baseline_risk_score: float
    simulated_risk_score: float
    risk_score_delta: float
    baseline_category: str
    simulated_category: str
    category_escalated: bool
    baseline_fs: float
    simulated_fs: float
    baseline_hazard: float = 0.0
    simulated_hazard: float = 0.0
    baseline_exposure: float = 0.0
    simulated_exposure: float = 0.0
    difference_class: str = "UNCHANGED"  # RISK_INCREASED, RISK_DECREASED, NEWLY_CRITICAL, NEWLY_HIGH, UNCHANGED
    newly_exposed_infrastructure_count: int
    affected_infrastructure_names: List[str] = []
    exposed_lifeline_details: List[Dict[str, Any]] = []
    affected_population: int = 0


class SimulationResponse(BaseModel):
    scenario_name: str
    timestamp: datetime
    executed_by: str
    parameters: Dict[str, Any]
    active_model_version: str = "v1.2.0-gradient-boosting"
    locations_evaluated: int
    escalated_zones_count: int
    newly_critical_count: int
    newly_high_count: int = 0
    total_additional_population_exposed: int
    results: List[SimulationLocationResult]
    from_cache: bool = False
    disclaimer: str = (
        "Simulation results represent model-based scenarios and should be interpreted "
        "as decision-support information, not deterministic predictions of landslide occurrence."
    )


class SimulationComparisonRequest(BaseModel):
    scenario_a: SimulationRequest
    scenario_b: SimulationRequest


class SimulationComparisonLocationResult(BaseModel):
    location_id: int
    location_name: str
    district: str
    score_a: float
    score_b: float
    score_delta_b_minus_a: float
    category_a: str
    category_b: str
    fs_a: float
    fs_b: float
    is_newly_critical_in_b: bool
    is_newly_high_in_b: bool
    additional_population_in_b: int
    newly_exposed_lifelines_in_b: List[str] = []


class SimulationComparisonResponse(BaseModel):
    timestamp: datetime
    scenario_a_parameters: Dict[str, Any]
    scenario_b_parameters: Dict[str, Any]
    total_locations_compared: int
    escalated_in_b_count: int
    newly_critical_in_b_count: int
    net_additional_population_exposed: int
    results: List[SimulationComparisonLocationResult]
    disclaimer: str = (
        "Simulation results represent model-based scenarios and should be interpreted "
        "as decision-support information, not deterministic predictions of landslide occurrence."
    )


class SimulationReportRequest(BaseModel):
    scenario: SimulationRequest
    report_format: str = "json"  # json, html, markdown


class SimulationReportResponse(BaseModel):
    report_id: str
    generated_at: datetime
    scenario_name: str
    parameters: Dict[str, Any]
    model_version: str
    executive_summary: Dict[str, Any]
    catchment_details: List[Dict[str, Any]]
    critical_lifelines_exposed: List[Dict[str, Any]]
    limitations: List[str]
    disclaimer: str
    formatted_content: Optional[str] = None


class SimulationTimeSeriesRequest(BaseModel):
    location_id: int
    rainfall_multiplier: float = 1.5
    additional_rainfall_mm: float = 50.0
    duration_hours: int = 24


class SimulationTimeSeriesPoint(BaseModel):
    hour: int
    timestamp: str
    baseline_hourly_mm: float
    simulated_hourly_mm: float
    cumulative_baseline_mm: float
    cumulative_simulated_mm: float
    projected_risk_score: float
    projected_fs: float
    projected_category: str


class SimulationTimeSeriesResponse(BaseModel):
    location_id: int
    location_name: str
    district: str
    duration_hours: int
    series: List[SimulationTimeSeriesPoint]
    disclaimer: str = (
        "Simulation results represent model-based scenarios and should be interpreted "
        "as decision-support information, not deterministic predictions of landslide occurrence."
    )


# --- Model Management & Traceability ---
class ModelVersionResponse(BaseModel):
    version_tag: str
    algorithm: str
    training_timestamp: datetime
    dataset_version: str
    accuracy: float
    f1_score: float
    roc_auc: float
    sample_count: int
    is_active: bool
    is_synthetic: bool
    feature_importances: Dict[str, float]

    model_config = ConfigDict(from_attributes=True)


# --- Data Quality & Health ---
class DataQualityResponse(BaseModel):
    source_name: str
    provider_type: str
    freshness_seconds: int
    missing_value_rate: float
    coverage_pct: float
    quality_status: str
    is_demo: bool
    diagnostic_message: Optional[str] = None


# --- Audit ---
class AuditEventResponse(BaseModel):
    id: int
    timestamp: datetime
    user_name: str
    action_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    client_ip: Optional[str] = None
    payload_summary: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# --- System Overview / Dashboard KPI ---
class DashboardOverviewResponse(BaseModel):
    timestamp: datetime
    data_mode: str # DEMO or REAL
    active_model_version: str
    total_monitored_zones: int
    critical_zones_count: int
    high_zones_count: int
    moderate_zones_count: int
    low_zones_count: int
    active_alerts_count: int
    pending_inspections_count: int
    max_24h_rainfall_mm: float
    data_health_overall: str
    highest_risk_locations: List[RiskAssessmentResponse]
    critical_alerts: List[AlertResponse]
    top_inspections: List[InspectionTaskResponse]


# --- Machine Learning Risk Engine Schemas ---
class MLFeatureSchemaItem(BaseModel):
    name: str
    feature_type: str
    unit: str
    display_name: str
    description: str
    category: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    default_value: Any = None
    baseline_value: Any = None
    imputation_strategy: str = "median"
    allowed_categories: Optional[List[str]] = None
    is_required: bool = False


class MLFeatureSchemaResponse(BaseModel):
    total_features: int
    required_features: List[str]
    features: List[MLFeatureSchemaItem]


class MLPredictRequest(BaseModel):
    features: Dict[str, Any]
    data_timestamp: Optional[datetime] = None


class MLPredictResponse(BaseModel):
    risk_score: float
    risk_probability: float
    risk_category: str
    model_version: str
    prediction_timestamp: str
    data_timestamp: str
    feature_quality: Dict[str, Any]
    confidence: float
    explanation: Dict[str, Any]
    is_demo: bool = True
    disclaimer: str = "DEMO MODEL - NOT FOR REAL-WORLD DECISION MAKING"


class MLBatchPredictItem(BaseModel):
    cell_id: Optional[Union[str, int]] = None
    location_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    features: Dict[str, Any]


class MLBatchPredictRequest(BaseModel):
    items: List[MLBatchPredictItem]


class MLBatchPredictResponse(BaseModel):
    total_processed: int
    model_version: str
    results: List[Dict[str, Any]]


class MLEvaluationResponse(BaseModel):
    version_tag: str
    algorithm: str
    is_demo: bool
    dataset_type: str
    sample_count: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    brier_score: float
    confusion_matrix: Dict[str, int]
    calibration_curve: List[Dict[str, float]]
    feature_importances: Dict[str, float]


class MLTrainRequest(BaseModel):
    algorithm: str = "RandomForest"
    n_samples: int = 1600
    dataset_path: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None


# --- Explainable AI (XAI) Subsystem Schemas ---
class XAIFeatureDetail(BaseModel):
    feature_name: str
    display_name: str
    category: str
    observed_value: Any
    unit: str
    baseline_reference: Optional[Any] = None
    reference_comparison_text: Optional[str] = None
    delta_probability: float
    relative_influence_pct: float
    direction: str  # "INCREASES_RISK", "DECREASES_RISK", "NEUTRAL"
    global_importance_pct: float = 0.0
    data_freshness: str = "FRESH"  # "FRESH", "RECENT", "STALE", "UNAVAILABLE"
    quality_status: str = "MEASURED"  # "MEASURED", "IMPUTED/ESTIMATED", "CLIPPED", "SYNTHETIC_DEMO"
    source_attribution: str = "IMD Telemetry / SRTM DEM / Survey"
    narrative: str


class XAIConfidenceAssessment(BaseModel):
    tier: str  # "HIGH", "MEDIUM", "LOW"
    confidence_score: float  # 0.0 to 1.0
    data_quality_score: float
    model_consensus_score: float
    tree_agreement_variance: float
    imputed_features_count: int
    methodology_rationale: str


class XAIAnalystView(BaseModel):
    base_probability: float
    predicted_probability: float
    risk_score: float
    risk_category: str
    geotechnical_fs: Optional[float] = None
    top_risk_drivers: List[XAIFeatureDetail]
    top_protective_factors: List[XAIFeatureDetail]
    all_features: List[XAIFeatureDetail]
    physical_narrative: str
    raw_feature_vector: Dict[str, Any]
    model_hyperparameters: Optional[Dict[str, Any]] = None
    imputed_fields: List[str] = []
    clipped_fields: List[str] = []


class XAICommunityView(BaseModel):
    risk_level: str
    risk_summary_badge: str
    plain_language_headline: str
    why_risk_is_elevated: List[str]
    mitigating_protective_factors: List[str]
    affected_area_summary: str
    active_monitoring_actions: List[str]
    recommended_citizen_actions: List[str]


class XAIExplanationResponse(BaseModel):
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    prediction_timestamp: str
    data_timestamp: str
    model_version: str
    algorithm: str
    is_demo: bool = True
    confidence: XAIConfidenceAssessment
    analyst_view: XAIAnalystView
    community_view: XAICommunityView
    disclaimer: str = (
        "DECISION SUPPORT ONLY: Interpret model explanations as qualitative guidance. "
        "Do not interpret as guarantees of landslide occurrence or ground safety."
    )


class XAIModelTransparencyResponse(BaseModel):
    model_version: str
    algorithm: str
    training_dataset_id: str
    sample_count: int
    training_timestamp: str
    is_demo: bool
    feature_count: int
    feature_schema: List[Dict[str, Any]]
    evaluation_metrics: Dict[str, Any]
    confusion_matrix: Dict[str, int]
    physical_assumptions_and_limitations: List[str]
    disclaimer: str


# --- Historical Landslide and Risk Analytics Schemas ---

class HistoricalLandslideDetailResponse(BaseModel):
    id: int
    location_id: int
    location_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    event_date: datetime
    latitude: float
    longitude: float
    trigger_type: str
    estimated_volume_m3: Optional[float] = None
    casualties: int = 0
    damage_rating: str
    severity: str
    data_source: str
    affected_area_m2: Optional[float] = None
    rainfall_conditions_mm: Optional[float] = None
    nearby_infrastructure: Optional[List[Dict[str, Any]]] = None
    data_confidence: str
    notes: Optional[str] = None
    is_demo: bool = True

    model_config = ConfigDict(from_attributes=True)


class SeasonalDataPoint(BaseModel):
    month: int
    month_name: str
    event_count: int
    avg_rainfall_mm: float
    total_casualties: int
    total_volume_m3: float
    is_monsoon_peak: bool


class AnnualTrendDataPoint(BaseModel):
    year: int
    event_count: int
    critical_events: int
    severe_events: int
    moderate_events: int
    minor_events: int
    total_casualties: int
    total_debris_volume_m3: float


class RainfallEventPoint(BaseModel):
    event_id: int
    event_date: str
    location_name: str
    district: str
    rainfall_24h_mm: float
    severity: str
    trigger_type: str
    volume_m3: Optional[float] = None
    threshold_category: str


class RegionalComparisonItem(BaseModel):
    district: str
    state: str
    total_events: int
    avg_severity_score: float
    total_casualties: int
    avg_slope_degrees: float
    critical_infrastructure_count: int
    historical_alerts_count: int
    predominant_trigger: str


class RiskTrendPoint(BaseModel):
    timestamp: str
    mean_risk_score: float
    critical_zone_count: int
    high_zone_count: int
    avg_geotechnical_fs: float


class AlertTrendPoint(BaseModel):
    period: str
    advisory_count: int
    watch_count: int
    warning_count: int
    evacuation_count: int
    total_alerts: int


class TimelineSnapshotCatchment(BaseModel):
    location_id: int
    name: str
    district: str
    latitude: float
    longitude: float
    risk_score: float
    risk_category: str
    geotechnical_fs: float
    rainfall_24h_mm: float
    active_alert_level: Optional[str] = None


class TimelineSnapshot(BaseModel):
    snapshot_id: str
    date: str
    title: str
    description: str
    catchments: List[TimelineSnapshotCatchment]
    events_active: List[Dict[str, Any]]


class PeriodTrendComparison(BaseModel):
    current_period_label: str
    previous_period_label: str
    current_events_count: int
    previous_events_count: int
    events_delta: int
    events_pct_change: float
    events_direction: str
    current_avg_risk_score: float
    previous_avg_risk_score: float
    risk_score_delta: float
    risk_pct_change: float
    risk_direction: str
    current_alerts_count: int
    previous_alerts_count: int
    alerts_delta: int
    scientific_causation_caveat: str = (
        "EPISTEMIC LIMITATION: Correlation between precipitation intensity and landslide "
        "frequencies represents empirical observational association, NOT direct univariate "
        "causation. Geotechnical limit-equilibrium failure is governed by multivariate factors "
        "including pore-water pressure, slope curvature, bedrock bedding dip, and material cohesion."
    )


class AnalyticsSummaryResponse(BaseModel):
    total_cataloged_events: int
    filtered_events_count: int
    total_casualties: int
    total_debris_volume_m3: float
    date_range_applied: Dict[str, Optional[str]]
    period_comparison: PeriodTrendComparison
    risk_category_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]
    trigger_type_distribution: Dict[str, int]
    data_source_distribution: Dict[str, int]
    disclaimer: str = (
        "HISTORICAL RECORD TRANSPARENCY: Historical failure events and assessment records "
        "are compiled from cataloged geotechnical inventories and calibrated demonstration data. "
        "All demo records are explicitly attributed. Do not extrapolate deterministic forecasts."
    )



