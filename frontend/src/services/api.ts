import {
  DashboardOverview,
  RiskAssessment,
  AlertItem,
  AlertsSummaryMetrics,
  AlertTriggerConfig,
  InspectionTask,
  SimulationResponse,
  SimulationComparisonResponse,
  SimulationReportResponse,
  SimulationTimeSeriesResponse,
  InfrastructureAsset,
  HistoricalLandslide,
  LocationSummary,
  DetailedHealthResponse,
  MLFeatureSchemaResponse,
  MLPredictResponse,
  MLEvaluationResponse,
  GISHotspotItem,
  GISLocationImpactResponse,
  XAIExplanationResponse,
  XAIModelTransparencyResponse,
  SeasonalDataPoint,
  AnnualTrendDataPoint,
  RainfallEventPoint,
  RegionalComparisonItem,
  TimelineSnapshot,
  AnalyticsSummaryResponse,
  AnalyticsFilterOptions
} from '../types';


const API_BASE = '/api/v1';

let currentAuthToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('landslide_auth_token') : null;
let currentRole: string = typeof window !== 'undefined' ? (localStorage.getItem('landslide_auth_role') || 'ADMIN') : 'ADMIN';
let currentUser: any = typeof window !== 'undefined' && localStorage.getItem('landslide_auth_user') ? JSON.parse(localStorage.getItem('landslide_auth_user')!) : null;

export const authState = {
  getToken: () => currentAuthToken,
  setToken: (token: string | null, role?: string, user?: any) => {
    currentAuthToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('landslide_auth_token', token);
        if (role) {
          currentRole = role;
          localStorage.setItem('landslide_auth_role', role);
        }
        if (user) {
          currentUser = user;
          localStorage.setItem('landslide_auth_user', JSON.stringify(user));
        }
      } else {
        localStorage.removeItem('landslide_auth_token');
        localStorage.removeItem('landslide_auth_user');
      }
    }
  },
  getRole: () => currentRole,
  getUser: () => currentUser
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };
    if (currentAuthToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('API_TIMEOUT: Request took longer than 8000ms');
    }
    throw error;
  }
}

export const api = {
  // Auth & Operational Roles
  async login(username: string, password: string): Promise<{ access_token: string; role: string; username: string }> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Authentication failed for ${username}`);
    const data = await res.json();
    authState.setToken(data.access_token, data.role, { username: data.username, role: data.role });
    return data;
  },

  async switchRole(role: 'ADMIN' | 'ANALYST' | 'FIELD_OFFICER' | 'READ_ONLY'): Promise<{ access_token: string; role: string }> {
    const roleCreds: Record<string, { u: string; p: string }> = {
      'ADMIN': { u: 'admin', p: 'AdminPass2026!' },
      'ANALYST': { u: 'analyst', p: 'AnalystPass2026!' },
      'FIELD_OFFICER': { u: 'field_officer', p: 'FieldPass2026!' },
      'READ_ONLY': { u: 'viewer', p: 'ViewerPass2026!' }
    };
    const cred = roleCreds[role] || roleCreds['ADMIN'];
    return this.login(cred.u, cred.p);
  },

  async getCurrentUser(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load user profile`);
    return res.json();
  },

  getAuthToken(): string | null {
    return authState.getToken();
  },

  setAuthToken(token: string | null): void {
    authState.setToken(token);
  },

  getAuthRole(): string {
    return authState.getRole();
  },

  // Overview
  async getOverview(): Promise<DashboardOverview> {
    const res = await fetchWithTimeout(`${API_BASE}/overview`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load dashboard overview`);
    return res.json();
  },

  // GIS Layers & Spatial Intelligence
  async getRiskZonesGeoJSON(filters?: { category?: string; min_score?: number; max_score?: number; district?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.min_score !== undefined) params.append('min_score', String(filters.min_score));
    if (filters?.max_score !== undefined) params.append('max_score', String(filters.max_score));
    if (filters?.district) params.append('district', filters.district);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/gis/layers/risk-zones${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load risk zone polygons`);
    return res.json();
  },

  async getRiskGridGeoJSON(locationId?: number): Promise<any> {
    const params = locationId ? `?location_id=${locationId}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/gis/layers/risk-grid${params}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load risk grid cells`);
    return res.json();
  },

  async getEnvironmentalGeoJSON(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/gis/layers/environmental`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load environmental stream and fault lines`);
    return res.json();
  },

  async getInfrastructureGeoJSON(filters?: { asset_type?: string; lifeline_tier?: number; location_id?: number }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.asset_type) params.append('asset_type', filters.asset_type);
    if (filters?.lifeline_tier) params.append('lifeline_tier', String(filters.lifeline_tier));
    if (filters?.location_id) params.append('location_id', String(filters.location_id));
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/gis/layers/infrastructure${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load infrastructure points`);
    return res.json();
  },

  async getHistoricalLandslidesGeoJSON(filters?: { trigger_type?: string; min_casualties?: number }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.trigger_type) params.append('trigger_type', filters.trigger_type);
    if (filters?.min_casualties !== undefined) params.append('min_casualties', String(filters.min_casualties));
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/gis/layers/historical-landslides${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load historical scars`);
    return res.json();
  },

  async getGISHotspots(): Promise<GISHotspotItem[]> {
    const res = await fetchWithTimeout(`${API_BASE}/gis/hotspots`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load ranked risk hotspots`);
    return res.json();
  },

  async getGISLocationImpact(locationId: number, dangerBufferM = 2500.0): Promise<GISLocationImpactResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/gis/location/${locationId}/impact?danger_buffer_meters=${dangerBufferM}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load catchment spatial impact`);
    return res.json();
  },

  // Locations & Catchments
  async getLocations(): Promise<LocationSummary[]> {
    const res = await fetchWithTimeout(`${API_BASE}/locations`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to list locations`);
    return res.json();
  },

  async getLocationDetail(id: number): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/locations/${id}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load location detail`);
    return res.json();
  },

  // Risk Assessments
  async getAllRiskAssessments(): Promise<RiskAssessment[]> {
    const res = await fetchWithTimeout(`${API_BASE}/risk/all`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to compute risk assessments`);
    return res.json();
  },

  async getRiskThresholds(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/risk/thresholds`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load thresholds`);
    return res.json();
  },

  async updateRiskThresholds(thresholds: Record<string, number>): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/risk/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to update thresholds`);
    return res.json();
  },

  // Alerts
  async getAlerts(filters?: { status?: string; severity?: string; priority?: string; location_id?: number }): Promise<AlertItem[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.location_id) params.append('location_id', String(filters.location_id));
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/alerts${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load alerts`);
    return res.json();
  },

  async getAlertSummary(): Promise<AlertsSummaryMetrics> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/summary`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load alerts summary`);
    return res.json();
  },

  async evaluateAlerts(locationId?: number): Promise<{ evaluated_locations: number; generated_or_updated: number; alerts: AlertItem[] }> {
    const query = locationId ? `?location_id=${locationId}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/alerts/evaluate${query}`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to evaluate alerts`);
    return res.json();
  },

  async acknowledgeAlert(id: number, acknowledged_by: string, action_notes?: string): Promise<AlertItem> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledged_by, action_notes })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to acknowledge alert`);
    return res.json();
  },

  async assignAlert(id: number, assigned_to: string, action_notes?: string): Promise<AlertItem> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to, action_notes })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to assign alert`);
    return res.json();
  },

  async updateAlertStatus(id: number, status: string, user_name = 'COMMANDER', resolution_notes?: string): Promise<AlertItem> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, user_name, resolution_notes })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to update alert status`);
    return res.json();
  },

  async resolveAlert(id: number, resolved_by: string, resolution_notes: string): Promise<AlertItem> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved_by, resolution_notes })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to resolve alert`);
    return res.json();
  },

  async getAlertCAP(id: number): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/${id}/cap`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load CAP payload`);
    return res.json();
  },

  async getAlertConfig(): Promise<AlertTriggerConfig> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/config`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load alert trigger config`);
    return res.json();
  },

  async updateAlertConfig(config: Partial<AlertTriggerConfig>): Promise<AlertTriggerConfig> {
    const res = await fetchWithTimeout(`${API_BASE}/alerts/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to update alert config`);
    return res.json();
  },

  // Inspections
  async getInspections(filters?: { urgency_tier?: string; status?: string; location_id?: number; assigned_officer?: string }): Promise<InspectionTask[]> {
    const params = new URLSearchParams();
    if (filters?.urgency_tier) params.append('urgency_tier', filters.urgency_tier);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location_id) params.append('location_id', String(filters.location_id));
    if (filters?.assigned_officer) params.append('assigned_officer', filters.assigned_officer);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/inspections${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load inspection tasks`);
    return res.json();
  },

  async getInspectionDetail(id: number): Promise<InspectionTask> {
    const res = await fetchWithTimeout(`${API_BASE}/inspections/${id}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load inspection detail`);
    return res.json();
  },

  async createInspection(payload: {
    location_id: number;
    infrastructure_id?: number;
    reason: string;
    assigned_officer?: string;
    assigned_team?: string;
    deadline_hours?: number;
    notes?: string;
  }): Promise<InspectionTask> {
    const res = await fetchWithTimeout(`${API_BASE}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to create inspection task`);
    return res.json();
  },

  async recalculateInspections(): Promise<InspectionTask[]> {
    const res = await fetchWithTimeout(`${API_BASE}/inspections/prioritize`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to recalculate inspections`);
    return res.json();
  },

  async updateInspection(id: number, update: { status?: string; assigned_team?: string; assigned_officer?: string; field_notes?: string }): Promise<InspectionTask> {
    const res = await fetchWithTimeout(`${API_BASE}/inspections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to update inspection`);
    return res.json();
  },

  async attachInspectionEvidence(id: number, evidence: {
    inspector_name: string;
    crack_displacement_mm?: number;
    observed_creep_severity?: string;
    seepage_observed: boolean;
    photo_reference_ids?: string[];
    evidence_notes?: string;
  }): Promise<InspectionTask> {
    const res = await fetchWithTimeout(`${API_BASE}/inspections/${id}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidence)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to attach field evidence`);
    return res.json();
  },

  // Simulation
  async runSimulation(payload: {
    scenario_name: string;
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
    saturation_override?: number;
  }, useCache = true): Promise<SimulationResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/run?use_cache=${useCache}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 15000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Simulation execution failed`);
    return res.json();
  },

  async compareSimulations(payload: {
    scenario_a: any;
    scenario_b: any;
  }): Promise<SimulationComparisonResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 15000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Scenario comparison failed`);
    return res.json();
  },

  async getSimulationGeoJSON(scenario: any, layerType: 'baseline' | 'scenario' | 'difference' = 'difference'): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/geojson?layer_type=${layerType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load simulation map layer`);
    return res.json();
  },

  async getSimulationReport(scenario: any, reportFormat = 'json'): Promise<SimulationReportResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, report_format: reportFormat })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to generate simulation report`);
    return res.json();
  },

  async getSimulationTimeSeries(payload: {
    location_id: number;
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
  }): Promise<SimulationTimeSeriesResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/timeseries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to project timeseries`);
    return res.json();
  },

  async getSimulationHistory(): Promise<any[]> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/history`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load simulation history`);
    return res.json();
  },

  async getSimulationCacheStats(): Promise<{ size: number; max_entries: number; hits: number; misses: number; hit_ratio: number }> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/cache/stats`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load cache stats`);
    return res.json();
  },

  async clearSimulationCache(): Promise<void> {
    const res = await fetchWithTimeout(`${API_BASE}/simulation/cache/clear`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to clear cache`);
  },

  // Weather
  async getLiveWeather(location_id: number): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/weather/live?location_id=${location_id}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch weather telemetry`);
    return res.json();
  },

  async switchMode(mode: 'DEMO' | 'REAL'): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/weather/switch-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    }, 15000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to switch operating mode`);
    return res.json();
  },

  async syncLiveWeather(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/weather/sync-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 15000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to synchronize live Open-Meteo telemetry`);
    return res.json();
  },

  async queryDisasterAssistant(query: string): Promise<{
    query: string;
    answer: string;
    citations: string[];
    recommended_view: string;
    timestamp: string;
  }> {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }, 10000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to query Disaster Intelligence Assistant`);
    return res.json();
  },

  // ML Models & Telemetry
  async getActiveModel(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/active`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch active model metadata`);
    return res.json();
  },

  async listModels(): Promise<any[]> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/models`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch registered model versions`);
    return res.json();
  },

  async activateModel(versionTag: string): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/models/${encodeURIComponent(versionTag)}/activate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to activate model version`);
    return res.json();
  },

  async getModelEvaluation(versionTag: string): Promise<MLEvaluationResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/models/${encodeURIComponent(versionTag)}/evaluation`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch model evaluation`);
    return res.json();
  },

  async getMLFeatureSchema(): Promise<MLFeatureSchemaResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/feature-schema`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch feature schema`);
    return res.json();
  },

  async predictMLRisk(features: Record<string, any>): Promise<MLPredictResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `HTTP_${res.status}: Risk prediction failed`);
    }
    return res.json();
  },

  async trainModel(payload: { algorithm: string; n_samples: number; dataset_path?: string }): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 25000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Training failed`);
    return res.json();
  },

  async retrainModel(algorithm: string, n_samples = 1500): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/ml/retrain?algorithm=${algorithm}&n_samples=${n_samples}`, {
      method: 'POST'
    }, 20000);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Retraining failed`);
    return res.json();
  },

  // Reports
  async getSitRepJSON(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/reports/sitrep`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to generate SitRep`);
    return res.json();
  },

  // Health & Reset
  async getDetailedHealth(): Promise<DetailedHealthResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/health/detailed`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Health check probe failed`);
    return res.json();
  },

  async resetDemoData(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/health/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Demo reset failed`);
    return res.json();
  },

  // Landslide Data Engine
  async getDataEngineHealth(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/health`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load data engine health`);
    return res.json();
  },

  async getFreshnessConfig(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/freshness-config`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load freshness config`);
    return res.json();
  },

  async updateFreshnessConfig(payload: { category: string; fresh_threshold_seconds: number; recent_threshold_seconds: number; stale_threshold_seconds: number }): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/freshness-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to update freshness config`);
    return res.json();
  },

  async getRollingRainfall(locationId?: number, latitude?: number, longitude?: number, hours = 168): Promise<any> {
    const params = new URLSearchParams();
    if (locationId) params.append('location_id', String(locationId));
    if (latitude) params.append('latitude', String(latitude));
    if (longitude) params.append('longitude', String(longitude));
    params.append('hours', String(hours));
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/rainfall/rolling?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch rolling rainfall`);
    return res.json();
  },

  async calculateTerrain(grid: number[][], cellSizeM = 30.0): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/terrain/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid, cell_size_m: cellSizeM })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to calculate terrain derivatives`);
    return res.json();
  },

  async getInfrastructureProximity(locationId?: number, latitude?: number, longitude?: number, dangerBufferM = 500.0): Promise<any> {
    const params = new URLSearchParams();
    if (locationId) params.append('location_id', String(locationId));
    if (latitude) params.append('latitude', String(latitude));
    if (longitude) params.append('longitude', String(longitude));
    params.append('danger_buffer_m', String(dangerBufferM));
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/infrastructure/proximity?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to calculate infrastructure proximity`);
    return res.json();
  },

  async getCacheStats(): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/cache/stats`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to fetch cache stats`);
    return res.json();
  },

  async clearCache(category?: string): Promise<any> {
    const params = category ? `?category=${category}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/cache/clear${params}`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to clear cache`);
    return res.json();
  },

  async generateDemoScenario(params: { name?: string; district?: string; state?: string; latitude?: number; longitude?: number; terrain_type?: string }): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/data-engine/demo/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to generate demo scenario`);
    return res.json();
  },

  // Explainable AI (XAI)
  async getLocationExplanation(locationId: number): Promise<XAIExplanationResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/xai/location/${locationId}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load location explainability`);
    return res.json();
  },

  async explainCustomFeatures(payload: {
    features: Record<string, any>;
    location_name?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    population?: number;
    threatened_lifelines?: string[];
  }): Promise<XAIExplanationResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/xai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to explain custom features`);
    return res.json();
  },

  async getModelTransparency(): Promise<XAIModelTransparencyResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/xai/transparency`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load model transparency report`);
    return res.json();
  },

  // Historical Landslide & Risk Analytics
  async getAnalyticsSummary(filters?: AnalyticsFilterOptions): Promise<AnalyticsSummaryResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.district && filters.district !== 'ALL') params.append('district', filters.district);
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
    if (filters?.dataSource && filters.dataSource !== 'ALL') params.append('data_source', filters.dataSource);
    if (filters?.riskCategory && filters.riskCategory !== 'ALL') params.append('risk_category', filters.riskCategory);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/analytics/summary${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load analytics summary`);
    return res.json();
  },

  async getSeasonalAnalysis(filters?: { startDate?: string; endDate?: string; district?: string }): Promise<SeasonalDataPoint[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.district && filters.district !== 'ALL') params.append('district', filters.district);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/analytics/seasonal${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load seasonal analysis`);
    return res.json();
  },

  async getAnnualTrends(district?: string): Promise<AnnualTrendDataPoint[]> {
    const params = new URLSearchParams();
    if (district && district !== 'ALL') params.append('district', district);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/analytics/annual${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load annual trends`);
    return res.json();
  },

  async getRainfallEventRelationship(district?: string, minRainfall = 0.0): Promise<RainfallEventPoint[]> {
    const params = new URLSearchParams();
    if (district && district !== 'ALL') params.append('district', district);
    if (minRainfall > 0) params.append('min_rainfall', String(minRainfall));
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/analytics/rainfall-events${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load rainfall-event relationships`);
    return res.json();
  },

  async getRegionalComparison(): Promise<RegionalComparisonItem[]> {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/regional`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load regional comparison`);
    return res.json();
  },

  async getTimelineSnapshots(): Promise<TimelineSnapshot[]> {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/timeline-snapshots`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load timeline snapshots`);
    return res.json();
  },

  async getHistoricalEventsGeoJSON(filters?: AnalyticsFilterOptions): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.district && filters.district !== 'ALL') params.append('district', filters.district);
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
    if (filters?.dataSource && filters.dataSource !== 'ALL') params.append('data_source', filters.dataSource);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/analytics/events/geojson${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load historical events GeoJSON`);
    return res.json();
  },

  async getHistoricalEventsPaginated(params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    district?: string;
    severity?: string;
    dataSource?: string;
    searchQuery?: string;
  }): Promise<{ total: number; page: number; per_page: number; events: HistoricalLandslide[] }> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.pageSize) qp.append('page_size', String(params.pageSize));
    if (params.startDate) qp.append('start_date', params.startDate);
    if (params.endDate) qp.append('end_date', params.endDate);
    if (params.district && params.district !== 'ALL') qp.append('district', params.district);
    if (params.severity && params.severity !== 'ALL') qp.append('severity', params.severity);
    if (params.dataSource && params.dataSource !== 'ALL') qp.append('data_source', params.dataSource);
    if (params.searchQuery) qp.append('search_query', params.searchQuery);
    const query = qp.toString() ? `?${qp.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/analytics/events${query}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load paginated historical events`);
    return res.json();
  },

  async getHistoricalEventDetail(eventId: number): Promise<HistoricalLandslide> {
    const res = await fetchWithTimeout(`${API_BASE}/analytics/events/${eventId}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load historical event detail #${eventId}`);
    return res.json();
  },

  // Feature 11: Satellite Remote-Sensing Change Detection
  async getSatelliteChange(locationId: number = 1): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/gis/satellite-change?location_id=${locationId}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load satellite change detection`);
    return res.json();
  },

  // Feature 13: Mountain Road & Route Vulnerability Analysis
  async getRoadVulnerability(district?: string): Promise<any> {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetchWithTimeout(`${API_BASE}/gis/road-vulnerability${q}`);
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to load road vulnerability analysis`);
    return res.json();
  },

  // Feature 15: Ground Incident Reporting & Field Verification Feedback Loop
  async reportGroundIncident(payload: {
    location_id: number;
    reporter_name: string;
    crack_width_mm: number;
    seepage_observed: boolean;
    tree_tilt_observed: boolean;
    evidence_notes: string;
  }): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE}/inspections/report-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}: Failed to record ground incident report`);
    return res.json();
  }
};


