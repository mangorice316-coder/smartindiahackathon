# Technical Architecture Document
## AI-Powered Landslide Risk Intelligence & Early Warning System

**Version:** 1.0.0-PROD  
**Document Status:** Approved & Baseline Established  
**System Classification:** Mission-Critical Disaster Management & Decision Support Platform  

---

## 1. Executive Summary & Core Philosophy

The **AI-Powered Landslide Risk Intelligence & Early Warning System** is an engineering-grade decision support platform engineered for disaster management authorities (NDRF, SDMA, DDMA), geotechnical engineers, and frontline response teams.

### Fundamental Operating Principles:
1. **Decision Support, Not Oracle:** The platform provides probabilistic landslide risk estimation and operational prioritization. It **never guarantees** that a landslide will or will not occur.
2. **Strict Data Provenance & Anti-Hallucination:** All demonstration or simulated datasets are explicitly tagged with `is_demo=True` or `data_source="DEMO_SYNTHETIC"`. Real data is strictly decoupled behind an extensible **Data Adapter Layer**.
3. **Scientific Separation of Disaster Dimensions:**
   - **Hazard:** The physical likelihood and intensity of a slope failure (driven by slope angle, soil saturation, lithology, rainfall intensity, and cumulative precipitation).
   - **Exposure:** Spatial presence of human settlements, lifelines (roads, bridges), public utilities, schools, and hospitals in the hazard path.
   - **Vulnerability:** The susceptibility of exposed elements to suffer physical damage, functional disruption, or loss of life.
   - Total Risk = f(Hazard, Exposure, Vulnerability).
4. **Transparent & Explainable AI (XAI):** Predictions are backed by dual mechanisms:
   - Physics-informed geotechnical mechanics (Infinite Slope Factor of Safety Fs).
   - Interpretable tabular Machine Learning (Random Forest & Gradient Boosting ensembles with SHAP-derived feature contribution attribution).

---

## 2. System Architecture & Component Separation

The platform enforces a strict separation of concerns across twelve decoupled modules:

```
+-----------------------------------------------------------------------------------+
|                     PRESENTATION LAYER (React 18 + Vite + TS)                     |
| - Interactive MapLibre / Leaflet GIS Canvas with Layer Switcher & Contours        |
| - Desktop-first Authority Command Room & Mobile Responsive Alert Center           |
| - Simulation Control Deck, Field Inspection Dispatcher, & PDF/JSON SitRep Center  |
+-----------------------------------------+-----------------------------------------+
                                          | REST / JSON / EventStream
                                          v
+-----------------------------------------------------------------------------------+
|                         APPLICATION API GATEWAY (FastAPI)                         |
| - OAuth2 / JWT Authentication & RBAC Guard (Admin, Analyst, Officer, Public)      |
| - Rate Limiting, Request Validation (Pydantic v2), & Audit Interceptor Middleware |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
+-----------------------+   +-----------------------+   +---------------------------+
|  DATA INGESTION LAYER |   |  CORE RISK & ML LAYER |   |  GEOSPATIAL & GIS ENGINE  |
| - Base Provider Spec  |   | - Geotechnical Fs Mod |   | - Spatial Indexing        |
| - Demo Adapter        |   | - ML Pipeline & Model |   | - GeoJSON Feature Parsing |
| - Real Adapters (AWS, |   |   Registry            |   | - Elevation & Buffer Zone |
|   Open-Meteo, ISRO)   |   | - Explainability (XAI)|   |   Intersections           |
| - Data Health Auditor |   | - Calibrated Fusion   |   | - Multi-Layer Tile Server |
+-----------------------+   +-----------------------+   +---------------------------+
        |                               |                                   |
        +-------------------------------+-----------------------------------+
                                        |
        +-------------------------------+-----------------------------------+
        |                               |                                   |
        v                               v                                   v
+-----------------------+   +-----------------------+   +---------------------------+
|   SIMULATION ENGINE   |   |     ALERT ENGINE      |   |  INSPECTION PRIORITIZER   |
| - Scenario Dataset    |   | - CAP Protocol Payloads|  | - Multi-Criteria Scoring  |
| - Rainfall Multipliers|   | - Siren / SMS Triggers|   | - Team Task Dispatch      |
|   (125%, 150%, 200%)  |   | - Acknowledgement Log |   | - Field GPS Checkpoint    |
| - Cascade Delta Calc  |   | - Severity Escalation |   |   Verification            |
+-----------------------+   +-----------------------+   +---------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                          PERSISTENCE & AUDIT ARCHITECTURE                         |
| - Normalized Relational Schema (SQLite for local dev / PostgreSQL for production) |
| - Immutable Audit Log Ledger (Every run, model version, prediction, alert, user)   |
| - Model Registry Artifact Store (Serialized models, pipeline specs, evaluation)   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Normalized Relational Data Model

Every entity is normalized, version-tracked, and audited:

1. **`locations`**: Spatial sub-catchment or administrative unit (ID, name, taluk, district, state, centroid coordinates, polygon boundary GeoJSON, population, elevation, area km²).
2. **`terrain_features`**: Digital Elevation Model derivatives (slope angle in degrees, aspect, profile curvature, plan curvature, Topographic Wetness Index - TWI).
3. **`soil_features`**: Geotechnical parameters (effective cohesion c', internal friction angle phi', saturated hydraulic conductivity Ksat, soil depth z, bulk density gamma).
4. **`geology_features`**: Lithology classification, fault line distance, weathering grade, structural bedding planes.
5. **`land_cover_features`**: LULC classification, NDVI vegetation density, deforestation factor, road cut proximity.
6. **`environmental_observations`**: Temporal readings (timestamp, temperature, relative humidity, pore water pressure, tiltmeter tilt angle, crack meter displacement).
7. **`rainfall_observations`**: Precipitation records (timestamp, 1h intensity mm/hr, 24h accumulation mm, 72h antecedent accumulation mm, 7-day cumulative mm, source identifier).
8. **`historical_landslides`**: Ground-truth historical inventory (date, coordinates, estimated volume m³, trigger type [monsoon, cloudburst, seismic], damage rating, casualties).
9. **`infrastructures`**: Critical physical assets (category: Highway, Bridge, Hospital, School, Power Substation, Telecommunication; name, GPS location, lifeline tier, capacity).
10. **`risk_assessments`**: Computed assessment (timestamp, location_id, hazard_score [0-100], exposure_score [0-100], overall_risk_score [0-100], risk_category [LOW, MODERATE, HIGH, CRITICAL], geotechnical_fs, confidence_score, model_version_id, explanation_json).
11. **`alerts`**: Operational early warnings (timestamp, location_id, risk_score, severity [ADVISORY, WATCH, WARNING, EVACUATION], trigger_rule, affected_infrastructure_json, recommended_sop, status [ACTIVE, ACKNOWLEDGED, RESOLVED], acknowledged_by, acknowledged_at).
12. **`simulations`**: Scenario runs (timestamp, scenario_name, rainfall_multiplier [e.g. 1.5], additional_rainfall_mm, duration_hours, initial_moisture_factor, results_summary_json, executed_by_user_id).
13. **`inspection_tasks`**: Prioritized field missions (id, location_id, asset_id, priority_score [0-100], urgency_category, assigned_team, status [PENDING, DISPATCHED, INSPECTED, CLEARED], field_notes, updated_at).
14. **`model_versions`**: Registered ML models (model_id, algorithm, version_tag, training_timestamp, dataset_version, accuracy, f1_score, roc_auc, hyperparameters_json, is_active).
15. **`model_predictions`**: Traceable inference records (prediction_id, model_version_id, location_id, feature_vector_json, predicted_probability, raw_output, explanation_json, created_at).
16. **`data_sources`**: Ingestion catalog (source_name, provider_type, update_frequency, endpoint_url, is_synthetic_demo).
17. **`data_quality_records`**: Health telemetry (source_id, timestamp, freshness_seconds, missing_value_rate, coverage_percentage, quality_status [HEALTHY, DEGRADED, STALE, FAILING]).
18. **`audit_events`**: Tamper-evident operational trail (id, user_id, action_type, entity_type, entity_id, client_ip, payload_summary, timestamp).
19. **`users`**: RBAC entities (id, username, hashed_password, full_name, role [ADMIN, ANALYST, FIELD_OFFICER, PUBLIC_VIEWER], is_active, created_at).

---

## 4. Scientific Risk Computation Engine

### A. Geotechnical Infinite Slope Stability (Physics Engine)
For planar slope failures, the Factor of Safety (Fs) represents the ratio of resisting shear strength to driving shear stress along the slip plane:

$$Fs = \frac{c' + (\gamma - m \cdot \gamma_w) \cdot z \cdot \cos^2\beta \cdot \tan\phi'}{\gamma \cdot z \cdot \sin\beta \cdot \cos\beta}$$

- Fs > 1.3: Structurally Stable (Low mechanical hazard)
- 1.0 <= Fs <= 1.3: Marginally Stable (Elevated hazard under rainfall)
- Fs < 1.0: Mechanically Unstable (Imminent slope failure)

### B. Interpretable Machine Learning Ensemble
- **Model Baseline:** Gradient Boosting & Random Forest trained on multi-temporal landslide triggers.
- **Input Feature Vector:**
  1. `slope_degrees`: Terrain inclination
  2. `twi`: Topographic Wetness Index
  3. `rainfall_intensity_1h`: Current downpour rate (mm/h)
  4. `rainfall_accum_24h`: Daily saturation load (mm)
  5. `rainfall_antecedent_72h`: Pre-wetting pore pressure driver (mm)
  6. `soil_moisture_ratio`: Relative degree of saturation (0 to 1)
  7. `soil_cohesion_kpa`: Effective shear resistance
  8. `ndvi_vegetation`: Root cohesion reinforcement index (-1 to 1)
  9. `historical_event_density`: Spatial proximity to historical failure scars
  10. `road_cut_distance`: Anthropogenic slope modification exposure (meters)
- **Output:** Predicted probability of landslide initiation P(Slide | X) in [0, 1].

### C. Hybrid Hazard Scoring (H)
$$H = 0.55 \cdot (P(ML) \times 100) + 0.45 \cdot \max(0, \min(100, \frac{1.5 - Fs}{0.8} \times 100))$$

### D. Exposure Scoring (E) & Total Risk (R)
$$E = w_p \cdot \text{Norm}(\text{Pop}) + w_r \cdot \text{Norm}(\text{Roads}) + w_c \cdot \text{Norm}(\text{CriticalFacilities})$$
$$\text{Total Landslide Risk } (R) = H^{0.65} \times E^{0.35} \in [0, 100]$$

---

## 5. Configurable Risk Categorization & Thresholds

| Risk Score (R) | Default Category | Operational Condition | Standard Operating Procedure (SOP) |
|---|---|---|---|
| **0 – 30** | **LOW (Green)** | Normal hydrological & terrain state | Routine remote monitoring; weekly sensor checks. |
| **31 – 50** | **MODERATE (Yellow)** | Elevated moisture or steep gradient | Issue technical advisory; monitor 6-hourly AWS stations; inspect drainage channels. |
| **51 – 70** | **HIGH (Orange)** | Critical saturation or rapid downpour | Issue formal Landslide Watch; deploy field inspection teams; prepare diversion routes. |
| **71 – 100** | **CRITICAL (Red)** | Imminent slope failure / debris flow trigger | Issue mandatory Evacuation Order; activate sirens; mobilize NDRF/SDRF; close lifeline highways. |

*Note: All category thresholds are user-configurable via application settings.*

---

## 6. Data Ingestion Architecture: Real vs. Demo Modes

```
               +--------------------------------------+
               |    Abstract Data Provider Interface  |
               +-------------------+------------------+
                                   |
                +------------------+------------------+
                |                                     |
                v                                     v
+-------------------------------+   +---------------------------------+
|      DEMO DATA ADAPTER        |   |       REAL DATA ADAPTER         |
| - Synthetic High-Fidelity Data|   | - Open-Meteo REST Client        |
| - Clearly tagged:             |   | - USGS / NASA SRTM 30m DEM Client|
|   `source="DEMO_SYNTHETIC"`   |   | - ISRO Bhuvan / Copernicus LULC |
| - Deterministic seedable runs |   | - Real AWS MQTT / LoRa Telemetry|
| - In-memory / seed reset      |   | - Circuit-breaker & Rate limiter|
+-------------------------------+   +---------------------------------+
```

---

## 7. Field Inspection Prioritization Scoring Formula

Field response resources are finite. The inspection urgency score prioritizes deployments where hazard and impact intersect:

$$\text{Urgency} = \min\left(100, \left( \frac{\text{Risk}}{100} \right)^{1.2} \times 50 + \text{CritInfraWeight} \times 25 + \text{RainfallTrendBonus} \times 15 + \text{DataConfidenceCorrection} \times 10 \right)$$

Priority Rankings:
- **Urgency >= 80:** Priority 1 (Immediate - Deploy within 2 hours)
- **60 <= Urgency < 80:** Priority 2 (High - Inspect within 12 hours)
- **40 <= Urgency < 60:** Priority 3 (Medium - Inspect within 48 hours)
- **Urgency < 40:** Priority 4 (Low - Scheduled monitoring)

---

## 8. Rainfall What-If Simulation Engine

- **Isolated Execution Context:** Simulations run against a cloned, decoupled scenario state to guarantee that historical and live operational observations are **never mutated**.
- **User Parameters:**
  - Multiplier (x1.25, x1.5, x2.0) or Absolute Delta (+50mm, +150mm, +300mm)
  - Event duration (1h flash storm, 6h cloudburst, 24h monsoon deluge)
  - Pre-existing soil saturation factor (30% dry, 65% damp, 95% saturated)
- **Dynamic Output:** Computes updated Fs, delta risk dR, newly breached threshold zones, newly threatened bridges and road segments, and estimated additional population needing evacuation.
