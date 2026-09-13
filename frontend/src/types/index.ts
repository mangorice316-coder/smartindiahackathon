export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'ADVISORY' | 'WATCH' | 'WARNING' | 'EVACUATION';
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'ACTIVE' | 'GENERATED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'UNDER_INSPECTION' | 'RESOLVED' | 'CLOSED';
export type InspectionStatus = 'PENDING' | 'DISPATCHED' | 'INSPECTED' | 'CLEARED' | 'CLOSED';
export type UrgencyTier = 'P1_IMMEDIATE' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
export type DataQualityStatus = 'HEALTHY' | 'DEGRADED' | 'STALE' | 'FAILING';

export interface ContributingFactor {
  factor_name: string;
  display_name: string;
  value: any;
  unit: string;
  contribution_score: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
  description: string;
}

export interface RiskExplanation {
  top_factors: ContributingFactor[];
  geotechnical_narrative: string;
  ml_confidence_narrative: string;
  data_freshness_status: string;
  missing_data_warnings: string[];
}

export interface RiskAssessment {
  id?: number;
  location_id: number;
  location_name: string;
  district: string;
  timestamp: string;
  hazard_score: number;
  exposure_score: number;
  overall_risk_score: number;
  risk_category: RiskCategory;
  geotechnical_fs: number;
  geotechnical_stability: string;
  model_confidence: number;
  model_version_tag: string;
  explanation: RiskExplanation;
  is_demo: boolean;
}

export interface LocationSummary {
  id: number;
  code: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  population: number;
  is_demo: boolean;
}

export interface InfrastructureAsset {
  id: number;
  name: string;
  asset_type: string;
  latitude: number;
  longitude: number;
  location_id?: number;
  location_name?: string;
  district?: string;
  lifeline_tier: number;
  capacity: number;
  exposure_weight: number;
  is_demo: boolean;
}

export interface HistoricalLandslide {
  id: number;
  location_id?: number;
  location_name?: string;
  district?: string;
  state?: string;
  event_date: string;
  latitude: number;
  longitude: number;
  trigger_type: string;
  estimated_volume_m3?: number;
  casualties: number;
  damage_rating: string;
  severity?: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC' | string;
  data_source?: string;
  affected_area_m2?: number;
  rainfall_conditions_mm?: number;
  nearby_infrastructure?: Array<{
    id: number;
    name: string;
    asset_type: string;
    distance_m: number;
    lifeline_tier: number;
    capacity?: number;
  }>;
  data_confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  notes?: string;
  is_demo?: boolean;
}

export interface AlertItem {
  id: number;
  alert_code?: string;
  location_id: number;
  location_name: string;
  district: string;
  timestamp: string;
  risk_score: number;
  risk_category?: RiskCategory;
  severity: AlertSeverity;
  priority?: AlertPriority;
  trigger_condition: string;
  affected_infrastructure: Array<{ name: string; type: string; tier?: number }>;
  data_sources?: string[];
  model_version?: string;
  recommended_action: string;
  status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  assigned_to?: string;
  assigned_at?: string;
  resolved_at?: string;
  closed_at?: string;
  escalation_count?: number;
  last_escalated_at?: string;
  is_demo: boolean;
}

export interface AlertsSummaryMetrics {
  total_alerts: number;
  active_alerts: number;
  acknowledged_alerts: number;
  assigned_alerts: number;
  under_inspection_alerts: number;
  resolved_alerts: number;
  closed_alerts: number;
  critical_priority_alerts: number;
  high_priority_alerts: number;
  medium_priority_alerts: number;
  low_priority_alerts: number;
  recent_escalations_24h: number;
  timestamp: string;
}

export interface AlertTriggerConfig {
  critical_risk_score_threshold: number;
  high_risk_score_threshold: number;
  moderate_risk_score_threshold: number;
  risk_score_increase_threshold: number;
  rapid_rainfall_mm_h_threshold: number;
  high_accum_rainfall_24h_mm: number;
  critical_accum_rainfall_24h_mm: number;
  cooldown_window_minutes: number;
  escalation_score_delta_threshold: number;
}

export interface InspectionEvidenceAttachment {
  evidence_id: string;
  recorded_at: string;
  inspector_name: string;
  crack_displacement_mm?: number;
  observed_creep_severity?: string;
  seepage_observed: boolean;
  photo_reference_ids: string[];
  evidence_notes?: string;
}

export interface InspectionPriorityBreakdown {
  raw_components: {
    risk_score: number;
    population_score: number;
    lifeline_score: number;
    rainfall_trend_score: number;
    historical_scar_score: number;
    risk_delta_score: number;
  };
  confidence_discount: number;
  weights: {
    w_risk: number;
    w_pop: number;
    w_infra: number;
    w_rain: number;
    w_hist: number;
    w_delta: number;
  };
  weighted_sum: number;
  final_priority_score: number;
  urgency_tier: UrgencyTier;
}

export interface InspectionTask {
  id: number;
  task_code?: string;
  location_id: number;
  location_name: string;
  district: string;
  infrastructure_id?: number;
  infrastructure_name?: string;
  priority_score: number;
  urgency_tier: UrgencyTier;
  risk_score?: number;
  assigned_team?: string;
  assigned_officer?: string;
  deadline?: string;
  status: InspectionStatus;
  rationale: string;
  contributing_factors?: string[];
  affected_infrastructure?: Array<{ name: string; type: string; tier?: number }>;
  priority_breakdown?: InspectionPriorityBreakdown;
  evidence_attachments?: InspectionEvidenceAttachment[];
  field_notes?: string;
  created_at: string;
  updated_at: string;
}

export type SimulationDifferenceClass = 'RISK_INCREASED' | 'RISK_DECREASED' | 'NEWLY_CRITICAL' | 'NEWLY_HIGH' | 'UNCHANGED';

export interface SimulationResult {
  location_id: number;
  location_name: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  baseline_risk_score: number;
  simulated_risk_score: number;
  risk_score_delta: number;
  baseline_category: RiskCategory;
  simulated_category: RiskCategory;
  category_escalated: boolean;
  baseline_fs: number;
  simulated_fs: number;
  baseline_hazard?: number;
  simulated_hazard?: number;
  baseline_exposure?: number;
  simulated_exposure?: number;
  difference_class?: SimulationDifferenceClass;
  newly_exposed_infrastructure_count: number;
  affected_infrastructure_names: string[];
  exposed_lifeline_details?: Array<{ name: string; asset_type: string; lifeline_tier: number; capacity?: number }>;
  affected_population?: number;
}

export interface SimulationResponse {
  scenario_name: string;
  timestamp: string;
  executed_by: string;
  parameters: {
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
    saturation_override?: number;
  };
  active_model_version?: string;
  locations_evaluated: number;
  escalated_zones_count: number;
  newly_critical_count: number;
  newly_high_count?: number;
  total_additional_population_exposed: number;
  results: SimulationResult[];
  from_cache?: boolean;
  disclaimer: string;
}

export interface SimulationComparisonLocationResult {
  location_id: number;
  location_name: string;
  district: string;
  score_a: number;
  score_b: number;
  score_delta_b_minus_a: number;
  category_a: RiskCategory;
  category_b: RiskCategory;
  fs_a: number;
  fs_b: number;
  is_newly_critical_in_b: boolean;
  is_newly_high_in_b: boolean;
  additional_population_in_b: number;
  newly_exposed_lifelines_in_b: string[];
}

export interface SimulationComparisonResponse {
  timestamp: string;
  scenario_a_parameters: {
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
  };
  scenario_b_parameters: {
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
  };
  total_locations_compared: number;
  escalated_in_b_count: number;
  newly_critical_in_b_count: number;
  net_additional_population_exposed: number;
  results: SimulationComparisonLocationResult[];
  disclaimer: string;
}

export interface SimulationReportResponse {
  report_id: string;
  generated_at: string;
  scenario_name: string;
  parameters: Record<string, any>;
  model_version: string;
  executive_summary: {
    total_locations_evaluated: number;
    escalated_zones_count: number;
    newly_critical_count: number;
    newly_high_count: number;
    total_additional_population_exposed: number;
    total_threatened_lifeline_assets: number;
  };
  catchment_details: Array<{
    location_id: number;
    location_name: string;
    district: string;
    baseline_score: number;
    simulated_score: number;
    delta: number;
    baseline_category: string;
    simulated_category: string;
    baseline_fs: number;
    simulated_fs: number;
    difference_class: string;
    population_at_risk: number;
    threatened_assets: string[];
  }>;
  critical_lifelines_exposed: Array<{
    location: string;
    district: string;
    name: string;
    asset_type: string;
    lifeline_tier: number;
    capacity?: number;
  }>;
  limitations: string[];
  disclaimer: string;
  formatted_content?: string;
}

export interface SimulationTimeSeriesPoint {
  hour: number;
  timestamp: string;
  baseline_hourly_mm: number;
  simulated_hourly_mm: number;
  cumulative_baseline_mm: number;
  cumulative_simulated_mm: number;
  projected_risk_score: number;
  projected_fs: number;
  projected_category: string;
}

export interface SimulationTimeSeriesResponse {
  location_id: number;
  location_name: string;
  district: string;
  duration_hours: number;
  series: SimulationTimeSeriesPoint[];
  disclaimer: string;
}

export type DirectiveActionType = 'EVACUATION' | 'ROAD_CLOSURE' | 'FIELD_DISPATCH' | 'RELIEF_SHELTER' | 'SENSOR_CALIBRATION' | 'CUSTOM' | string;
export type DirectiveUrgency = 'P1_IMMEDIATE' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW' | string;
export type DirectiveStatus = 'PENDING_DISPATCH' | 'ISSUED' | 'ACTIVE' | 'ACTIVE_CLOSURE' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'EXECUTED' | 'DISMISSED' | 'ESCALATED' | string;

export interface OperationalDirective {
  id: string;
  action_type: DirectiveActionType;
  title: string;
  target: string;
  urgency: DirectiveUrgency;
  rationale: string;
  status: DirectiveStatus;
  affected_population?: number;
  evidence_metric?: string;
  dispatched_at?: string;
  dispatched_by?: string;
}


export interface OperationalBriefing {
  primary_incident: string;
  current_severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  risk_trend: 'ESCALATING' | 'STABLE' | 'SUBSIDING';
  trend_pct: number;
  time_horizon: string;
  primary_trigger_summary: string;
  geological_mechanics: string;
  top_threat_sector: string;
  recommended_immediate_actions: OperationalDirective[];
  data_freshness: Record<string, string>;
  confidence_score: number;
}

export interface DataProvenance {
  source_name: string;
  last_updated: string;
  status: 'LIVE' | 'CACHED' | 'SIMULATED';
  confidence_pct: number;
  citation_url?: string;
}

export type BaseMapTileType = 'dark' | 'satellite' | 'terrain' | 'street';

export type FieldInspectionWorkflowStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'INSPECTING'
  | 'SUBMITTED'
  | 'SYNCED'
  | 'PENDING'
  | 'DISPATCHED'
  | 'INSPECTED'
  | 'CLEARED'
  | 'CLOSED';

export interface OfflineSyncState {
  is_offline: boolean;
  last_sync_time: string;
  cached_counts: {
    catchments: number;
    scars: number;
    lifelines: number;
    alerts: number;
  };
  pending_inspections_queue: Array<Partial<InspectionTask> & { local_id: string; queued_at: string }>;
}

export interface DashboardOverview {
  timestamp: string;
  data_mode: 'DEMO' | 'REAL';
  active_model_version: string;
  total_monitored_zones: number;
  critical_zones_count: number;
  high_zones_count: number;
  moderate_zones_count: number;
  low_zones_count: number;
  active_alerts_count: number;
  pending_inspections_count: number;
  max_24h_rainfall_mm: number;
  data_health_overall: string;
  highest_risk_locations: RiskAssessment[];
  critical_alerts: AlertItem[];
  top_inspections: InspectionTask[];
  operational_briefing?: OperationalBriefing;
}

export interface DataSourceHealth {
  source_name: string;
  provider_type: string;
  freshness_seconds: number;
  missing_value_rate: number;
  coverage_pct: number;
  quality_status: DataQualityStatus;
  is_demo: boolean;
  diagnostic_message?: string;
}

export interface DetailedHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  operating_mode: string;
  subsystems: {
    database: { status: string; latency_ms: number; engine: string };
    ml_engine: { status: string; active_model: string; inference_ready: boolean };
    physics_engine: { status: string; model: string };
    data_providers: { status: string; sources_count: number; sources: DataSourceHealth[] };
  };
}

export type FreshnessStatusType = 'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE';

export interface DataEngineProviderHealth {
  source_id: string;
  source_name: string;
  category: string;
  latest_update: string;
  age_seconds: number;
  record_count: number;
  coverage_pct: number;
  missing_data_pct: number;
  validation_status: string;
  freshness: FreshnessStatusType;
  freshness_description: string;
  quality_indicator: string;
  is_demo: boolean;
  dataset_type: string;
  source_attribution: string;
}

export interface DataEngineHealthResponse {
  timestamp: string;
  overall_status: string;
  dataset_type: string;
  disclaimer: string;
  providers_count: number;
  freshness_rules: Record<string, { fresh_threshold_seconds: number; recent_threshold_seconds: number; stale_threshold_seconds: number }>;
  providers: DataEngineProviderHealth[];
}

export interface RollingRainfallResponse {
  latitude: number;
  longitude: number;
  dataset_type: string;
  rolling_accumulations: {
    rainfall_1h: number;
    rainfall_3h: number;
    rainfall_6h: number;
    rainfall_12h: number;
    rainfall_24h: number;
    rainfall_3d: number;
    rainfall_7d: number;
    max_hourly_intensity: number;
    api_index: number;
    records_evaluated: number;
    computed_at: string;
  };
  hourly_series: Array<{ timestamp: string; intensity_1h_mm: number; is_demo?: boolean }>;
}

export interface ProximityAsset {
  name: string;
  asset_type: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  distance_km: number;
  lifeline_tier: number;
  capacity: number;
  exposure_weight: number;
  is_inside_danger_buffer: boolean;
}

export interface ProximityResponse {
  location_name?: string;
  dataset_type: string;
  origin_coordinates: { latitude: number; longitude: number };
  danger_buffer_meters: number;
  nearest_by_category: Record<string, ProximityAsset | null>;
  closest_overall_asset: ProximityAsset | null;
  closest_distance_meters: number | null;
  total_assets_evaluated: number;
  total_exposed_lifelines_count: number;
  exposed_lifelines: ProximityAsset[];
}

export interface CacheStatsResponse {
  active_items: number;
  total_stored: number;
  hits: number;
  misses: number;
  hit_ratio_pct: number;
  evictions: number;
}

// --- Machine Learning Landslide Risk Engine Types ---
export interface MLFeatureSchemaItem {
  name: string;
  feature_type: string;
  unit: string;
  display_name: string;
  description: string;
  category: string;
  min_value?: number;
  max_value?: number;
  default_value?: any;
  baseline_value?: any;
  imputation_strategy: string;
  allowed_categories?: string[];
  is_required: boolean;
}

export interface MLFeatureSchemaResponse {
  total_features: number;
  required_features: string[];
  features: MLFeatureSchemaItem[];
}

export interface MLFactorContribution {
  factor_name: string;
  display_name: string;
  observed_value: any;
  unit: string;
  delta_probability: number;
  relative_influence_pct: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
  narrative: string;
}

export interface MLExplanationPayload {
  base_probability: number;
  total_delta: number;
  top_risk_drivers: MLFactorContribution[];
  top_protective_factors: MLFactorContribution[];
  narrative: string;
}

export interface MLPredictResponse {
  risk_score: number;
  risk_probability: number;
  risk_category: RiskCategory;
  model_version: string;
  prediction_timestamp: string;
  data_timestamp: string;
  feature_quality: {
    status: string;
    imputed_fields: string[];
    clipped_fields: string[];
    missing_count: number;
  };
  confidence: number;
  explanation: MLExplanationPayload;
  is_demo: boolean;
  disclaimer: string;
}

export interface MLEvaluationResponse {
  version_tag: string;
  algorithm: string;
  is_demo: boolean;
  dataset_type: string;
  sample_count: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  brier_score: number;
  confusion_matrix: {
    true_positives: number;
    false_positives: number;
    true_negatives: number;
    false_negatives: number;
    total_samples: number;
  };
  calibration_curve: Array<{
    predicted_bin: number;
    observed_frequency: number;
  }>;
  feature_importances: Record<string, number>;
}

// --- GIS Risk Intelligence Command Center Types ---
export interface GISHotspotItem {
  rank: number;
  location_id: number;
  location_code: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  population: number;
  risk_score: number;
  risk_category: RiskCategory;
  hazard_score: number;
  exposure_score: number;
  geotechnical_fs: number;
  risk_delta_pct: number;
  rainfall_24h_mm: number;
  rainfall_7d_mm: number;
  exposed_lifelines_count: number;
  urgency_tier: UrgencyTier;
  primary_trigger: string;
  closest_lifeline: string;
  closest_lifeline_distance_m: number | null;
}

export interface GISLocationImpactResponse {
  location_id: number;
  location_name: string;
  district: string;
  state: string;
  catchment_population: number;
  origin_coordinates: {
    latitude: number;
    longitude: number;
  };
  danger_buffer_meters: number;
  impact_rating: 'CRITICAL_EXPOSURE' | 'HIGH_EXPOSURE' | 'MODERATE_EXPOSURE' | 'LOW_EXPOSURE';
  total_assets_evaluated: number;
  total_exposed_count: number;
  total_exposed_capacity: number;
  closest_overall: ProximityAsset | null;
  nearest_by_category: Record<string, ProximityAsset | null>;
  exposed_lifelines: ProximityAsset[];
}

export interface GISFilterOptions {
  category?: RiskCategory | '';
  minScore?: number;
  maxScore?: number;
  district?: string;
  searchQuery?: string;
  minRainfall24h?: number;
}

export interface GISLayerVisibility {
  riskZones: boolean;
  riskGrid: boolean;
  drainage: boolean;
  geologyFaults: boolean;
  villages: boolean;
  roads: boolean;
  bridges: boolean;
  schools: boolean;
  hospitals: boolean;
  historicalScars: boolean;
}

// --- Explainable AI (XAI) Subsystem Types ---
export interface XAIFeatureDetail {
  feature_name: string;
  display_name: string;
  category: string;
  observed_value: any;
  unit: string;
  baseline_reference?: any;
  reference_comparison_text?: string;
  delta_probability: number;
  relative_influence_pct: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK' | 'NEUTRAL';
  global_importance_pct: number;
  data_freshness: 'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE';
  quality_status: 'MEASURED' | 'IMPUTED/ESTIMATED' | 'CLIPPED' | 'SYNTHETIC_DEMO';
  source_attribution: string;
  narrative: string;
}

export interface XAIConfidenceAssessment {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  data_quality_score: number;
  model_consensus_score: number;
  tree_agreement_variance: number;
  imputed_features_count: number;
  methodology_rationale: string;
}

export interface XAIAnalystView {
  base_probability: number;
  predicted_probability: number;
  risk_score: number;
  risk_category: RiskCategory;
  geotechnical_fs?: number;
  top_risk_drivers: XAIFeatureDetail[];
  top_protective_factors: XAIFeatureDetail[];
  all_features: XAIFeatureDetail[];
  physical_narrative: string;
  raw_feature_vector: Record<string, any>;
  model_hyperparameters?: Record<string, any>;
  imputed_fields: string[];
  clipped_fields: string[];
}

export interface XAICommunityView {
  risk_level: RiskCategory;
  risk_summary_badge: string;
  plain_language_headline: string;
  why_risk_is_elevated: string[];
  mitigating_protective_factors: string[];
  affected_area_summary: string;
  active_monitoring_actions: string[];
  recommended_citizen_actions: string[];
}

export interface XAIExplanationResponse {
  location_id?: number;
  location_name?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  prediction_timestamp: string;
  data_timestamp: string;
  model_version: string;
  algorithm: string;
  is_demo: boolean;
  confidence: XAIConfidenceAssessment;
  analyst_view: XAIAnalystView;
  community_view: XAICommunityView;
  disclaimer: string;
}

export interface XAIModelTransparencyResponse {
  model_version: string;
  algorithm: string;
  training_dataset_id: string;
  sample_count: number;
  training_timestamp: string;
  is_demo: boolean;
  feature_count: number;
  feature_schema: Array<{
    name: string;
    display_name: string;
    unit: string;
    category: string;
    baseline_value?: any;
    global_importance_pct: number;
    is_required: boolean;
  }>;
  evaluation_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    pr_auc: number;
    brier_score: number;
  };
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
    total_samples: number;
  };
  physical_assumptions_and_limitations: string[];
  disclaimer: string;
}

// --- Historical Landslide and Risk Analytics Types ---

export interface SeasonalDataPoint {
  month: number;
  month_name: string;
  event_count: number;
  avg_rainfall_mm: number;
  total_casualties: number;
  total_volume_m3: number;
  is_monsoon_peak: boolean;
}

export interface AnnualTrendDataPoint {
  year: number;
  event_count: number;
  critical_events: number;
  severe_events: number;
  moderate_events: number;
  minor_events: number;
  total_casualties: number;
  total_debris_volume_m3: number;
}

export interface RainfallEventPoint {
  event_id: number;
  event_date: string;
  location_name: string;
  district: string;
  rainfall_24h_mm: number;
  severity: string;
  trigger_type: string;
  volume_m3?: number;
  threshold_category: string;
}

export interface RegionalComparisonItem {
  district: string;
  state: string;
  total_events: number;
  avg_severity_score: number;
  total_casualties: number;
  avg_slope_degrees: number;
  critical_infrastructure_count: number;
  historical_alerts_count: number;
  predominant_trigger: string;
}

export interface TimelineSnapshotCatchment {
  location_id: number;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_category: RiskCategory;
  geotechnical_fs: number;
  rainfall_24h_mm: number;
  active_alert_level?: string | null;
}

export interface TimelineSnapshot {
  snapshot_id: string;
  date: string;
  title: string;
  description: string;
  catchments: TimelineSnapshotCatchment[];
  events_active: Array<{
    id: number;
    date: string;
    location_name: string;
    district: string;
    latitude: number;
    longitude: number;
    severity: string;
    trigger_type: string;
    casualties: number;
    volume_m3?: number;
  }>;
}

export interface PeriodTrendComparison {
  current_period_label: string;
  previous_period_label: string;
  current_events_count: number;
  previous_events_count: number;
  events_delta: number;
  events_pct_change: number;
  events_direction: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  current_avg_risk_score: number;
  previous_avg_risk_score: number;
  risk_score_delta: number;
  risk_pct_change: number;
  risk_direction: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  current_alerts_count: number;
  previous_alerts_count: number;
  alerts_delta: number;
  scientific_causation_caveat: string;
}

export interface AnalyticsSummaryResponse {
  total_cataloged_events: number;
  filtered_events_count: number;
  total_casualties: number;
  total_debris_volume_m3: number;
  date_range_applied: {
    start_date?: string | null;
    end_date?: string | null;
  };
  period_comparison: PeriodTrendComparison;
  risk_category_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  trigger_type_distribution: Record<string, number>;
  data_source_distribution: Record<string, number>;
  disclaimer: string;
}

export interface AnalyticsFilterOptions {
  startDate?: string;
  endDate?: string;
  district?: string;
  severity?: string;
  dataSource?: string;
  riskCategory?: string;
  searchQuery?: string;
}


export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_role: string;
  action_type: string;
  action_title: string;
  target: string;
  rationale: string;
  previous_state: string;
  new_state: string;
  authorized_by: string;
  status: 'COMMITTED' | 'QUEUED_OFFLINE' | 'SYNCED' | 'REJECTED';
}

export interface FilterConditions {
  region: string;
  district: string;
  riskLevel: string;
  minRainfall: number;
  minSlope: number;
  soilSaturation: string;
  sensorStatus: string;
  timeRange: string;
  searchQuery: string;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  level: 'country' | 'state' | 'district' | 'taluk' | 'village' | 'zone';
}
