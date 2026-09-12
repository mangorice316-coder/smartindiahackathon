# REST API Reference & OpenAPI Contracts

The Landslide Risk Intelligence System (LRIDS) exposes an asynchronous, high-throughput REST API built on **FastAPI**. All operational endpoints return structured JSON payloads with strict Pydantic type validation.

**Base URL**: `http://localhost:8000/api/v1`  
**Interactive Docs**: `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)

---

## 1. System Health & Operational Status

### `GET /health/status`
Returns real-time liveness and component health across database, telemetry stream, and ML engine.

```bash
curl -X GET "http://localhost:8000/api/v1/health/status"
```

**Response (200 OK)**:
```json
{
  "status": "ONLINE",
  "database": "CONNECTED",
  "ml_engine": "READY",
  "telemetry_stream": "ACTIVE",
  "timestamp": "2026-09-12T06:00:00Z"
}
```

---

## 2. Command Center Overview

### `GET /overview`
Aggregates state-wide operational telemetry, active incidents, high-risk sectors, and tactical recommendations.

**Response (200 OK)**:
```json
{
  "timestamp": "2026-09-12T06:00:00Z",
  "data_mode": "REAL",
  "system_status": "OPERATIONAL",
  "active_incident_count": 3,
  "high_risk_zone_count": 2,
  "operational_briefing": {
    "primary_incident": "Monsoon Cloudburst Surge - Wayanad & Idukki Foothills",
    "current_severity": "CRITICAL",
    "risk_trend": "ESCALATING",
    "top_threat_sector": "Meppadi Upper Crest Line (Wayanad)",
    "data_freshness": {
      "weather": "LIVE Open-Meteo REST Stream",
      "satellite": "Sentinel-1 SAR / Sentinel-2 MSI",
      "geotechnical": "Mohr-Coulomb Limit Equilibrium Engine v2.4"
    }
  }
}
```

---

## 3. Decoupled Pipeline & Data Lineage

### `GET /ml/pipeline/lineage`
Returns the authoritative 5-Tier Data Hierarchy, active dataset checksum, offline evaluation metrics, and OpenStreetMap ODbL 1.0 license compliance statement.

```bash
curl -X GET "http://localhost:8000/api/v1/ml/pipeline/lineage"
```

**Response (200 OK)**:
```json
{
  "status": "ACTIVE_VERSIONED_PIPELINE",
  "lineage": {
    "model_version_tag": "LRIDS_GSI_ISRO_v2.1",
    "algorithm": "HistGradientBoostingClassifier",
    "training_dataset": {
      "name": "GSI_ISRO_NLFC_v2.1",
      "sha256": "b043958f9a4e49485679e0f7b88422ceae299956a2a9d5c559bcbda55a0cdf0a",
      "row_count": 6000,
      "positive_ratio": 0.451
    },
    "metrics": {
      "roc_auc": 0.9276,
      "pr_auc": 0.8851,
      "f1_score": 0.8428,
      "brier_score": 0.1064
    },
    "decoupled_architecture": {
      "is_decoupled": true,
      "training_source": "OFFLINE_MULTI_TIER_DATA_PIPELINE",
      "live_dashboard_dependency": false
    }
  },
  "hierarchy_specification": {
    "framework_version": "5-TIER-GSI-ISRO-v2.1",
    "tiers": [
      { "tier": "TIER_1_GSI_NLFC", "lead_agency": "Geological Survey of India" },
      { "tier": "TIER_2_ISRO_NRSC", "lead_agency": "ISRO / NRSC" },
      { "tier": "TIER_3_IMD_WEATHER", "lead_agency": "India Meteorological Department" },
      { "tier": "TIER_4_COPERNICUS_SAR", "lead_agency": "European Space Agency (ESA)" },
      { "tier": "TIER_5_OSM_INFRASTRUCTURE", "lead_agency": "OpenStreetMap Contributors" }
    ],
    "licensing": {
      "attribution_banner": "Base data © OpenStreetMap contributors under ODbL 1.0 | Geological Survey of India (GSI) NLFC | ISRO NRSC Landslide Atlas | Copernicus Data Space"
    }
  }
}
```

---

## 4. Real-Time Risk & Machine Learning Inference

### `POST /ml/predict`
Calculates instant landslide risk probability with Saabas tree-path feature attribution.

**Request Body**:
```json
{
  "slope": 36.5,
  "aspect": 215.0,
  "rainfall_24h_mm": 165.0,
  "rainfall_72h_antecedent_mm": 380.0,
  "pore_water_pressure_kpa": 42.0,
  "soil_saturation_pct": 92.5,
  "lithology": "charnockite_weathered",
  "land_use_cover": "tea_plantation"
}
```

**Response (200 OK)**:
```json
{
  "risk_score": 88.4,
  "risk_category": "CRITICAL",
  "factor_of_safety": 0.86,
  "model_version": "LRIDS_GSI_ISRO_v2.1",
  "feature_attributions": {
    "rainfall_72h_antecedent_mm": 28.4,
    "pore_water_pressure_kpa": 24.1,
    "slope": 18.2,
    "soil_saturation_pct": 11.5,
    "land_use_cover": 6.2
  }
}
```

---

## 5. Geospatial GIS Endpoints

- `GET /gis/layers/risk-zones`: GeoJSON polygons of monitored hillside catchments.
- `GET /gis/layers/historical-landslides`: Historical landslide scar centroids (~80,000 ISRO records).
- `GET /gis/layers/infrastructure`: Critical lifeline roads, bridges, and hospitals.
- `GET /gis/satellite-change?location_id=1`: Sentinel-1 SAR interferometric coherence loss and Sentinel-2 NDVI difference.
- `GET /gis/road-vulnerability?district=Wayanad`: Arterial highway pass vulnerability and bridge scour status.

---

## 6. Incident Reporting & Feedback Loop

### `POST /inspections/report-incident`
Allows field patrols or citizen wardens to log surface ground crack expansion.

**Request Body**:
```json
{
  "location_id": 1,
  "reporter_name": "Patrol Unit Alpha-4",
  "crack_width_mm": 48.5,
  "seepage_observed": true,
  "tree_tilt_observed": true,
  "evidence_notes": "Continuous tension crack expanding across tea estate crest line."
}
```\n