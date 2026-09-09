# LRIDS REST API Reference & OASIS CAP v1.2 Specification

> **Landslide Risk Intelligence & Decision Support System (LRIDS)**  
> Production REST API Documentation, Authentication, Role Permissions, and Alert Payloads  
> Verified: **15 Test Suites | 122 Automated Tests Passed (100%) | Zero Build Errors**

---

## 1. Authentication & Role-Based Access Control (RBAC)

All protected API endpoints accept a signed JSON Web Token (JWT) provided in the HTTP `Authorization` header:

```http
Authorization: Bearer <jwt_access_token>
```

### Operational Roles & Permissions Matrix
| Role | Endpoints Accessible | Typical Real-World Stakeholder |
|---|---|---|
| `ADMIN` | All endpoints, user management, configuration, seed resets | System Administrator / Chief Disaster Management Officer |
| `ANALYST` | Risk assessment, simulations, XAI, reporting, GIS exports | Senior GIS Specialist / Meteorological Analyst |
| `FIELD_OFFICER` | Inspections, field evidence submission, alerts acknowledgment | Quick Response Team (QRT) / PWD Geotechnical Engineer |
| `READ_ONLY` | Dashboard overview, GIS map, public bulletins, health check | Public Information Officer / Relief NGO Coordinator |

To switch or authenticate roles during development or testing:
```http
POST /api/v1/auth/switch-role
Content-Type: application/json

{
  "role": "ANALYST"
}
```

---

## 2. Core API Endpoints

### 2.1 Overview & Situational Awareness
* `GET /api/v1/overview/`  
  Returns high-level situational metrics: monitored locations, critical/high/moderate counts, active alerts, pending inspections, and lifeline exposure tallies.
* `GET /health`  
  Returns service status and database connectivity.
* `GET /api/v1/health/detailed`  
  Returns comprehensive system health including DB latency, memory usage, rate-limiter capacity, and data source freshness.

### 2.2 GIS Command Center & Spatial Impact
* `GET /api/v1/gis/geojson?layer_type=risk`  
  Returns GeoJSON FeatureCollection of all sub-catchment risk zones with risk scores, slope, and category metadata.
* `GET /api/v1/gis/hotspots`  
  Returns prioritized list of high-risk hotspots ranked by combined hazard and population exposure.
* `GET /api/v1/gis/location/{id}/impact?danger_buffer_meters=2500`  
  Calculates critical lifelines (hospitals, schools, bridges, roads) within the danger buffer of the specified catchment.

### 2.3 Machine Learning & Explainable AI (XAI)
* `POST /api/v1/ml/predict`  
  Executes ML risk estimation on a raw feature payload.
* `GET /api/v1/ml/explain/{location_id}`  
  Returns Saabas tree-path marginal feature contribution breakdown and local physical drivers.
* `GET /api/v1/ml/transparency`  
  Returns complete model governance card: training history, ROC-AUC, feature specs, and SHA-256 integrity checksum.

### 2.4 Rainfall What-If Simulation Engine
* `POST /api/v1/simulation/run`  
  Executes what-if deluge scenario in an isolated memory buffer (zero baseline DB mutation).  
  **Payload Schema**:
  ```json
  {
    "scenario_name": "Cloudburst Deluge (+50% Rainfall)",
    "rainfall_multiplier": 1.5,
    "additional_rainfall_mm": 25.0,
    "duration_hours": 24,
    "saturation_override": 0.85
  }
  ```
* `POST /api/v1/simulation/compare`  
  Computes delta comparisons between Scenario A and Scenario B.
* `POST /api/v1/simulation/geojson`  
  Returns GeoJSON difference layer highlighting newly escalated zones.

### 2.5 Early Warning Alerts (OASIS CAP v1.2)
* `GET /api/v1/alerts`  
  Lists active and historical early warning alerts with severity and status filters.
* `POST /api/v1/alerts/evaluate`  
  Triggers automated rule and ML threshold evaluation across all monitored catchments.
* `GET /api/v1/alerts/{id}/cap`  
  Returns international OASIS CAP v1.2 compliant alert payload in JSON or XML format (`?format=xml`).

### 2.6 Field Inspection Scheduling Matrix
* `GET /api/v1/inspections`  
  Returns inspection tasks ranked strictly in descending order of Multi-Factor Priority Score ($P \in [0, 100]$).
* `POST /api/v1/inspections/{id}/evidence`  
  Attaches geotechnical ground-truth observations (e.g. tension crack displacement mm, toe seepage, slope tilt).
* `POST /api/v1/inspections/{id}/status`  
  Transitions inspection status through `PENDING` -> `DISPATCHED` -> `INSPECTED` -> `CLEARED`.

### 2.7 Executive Reporting & SitRep
* `GET /api/v1/reports/sitrep?format=markdown`  
  Generates automated, publication-ready Situation Report (SitRep) for District Magistrates and Incident Commanders.

---

## 3. OASIS Common Alerting Protocol (CAP v1.2) Sample Payload

```json
{
  "identifier": "IN-KL-WAY-2026-0012",
  "sender": "EOC-WAYANAD-DISASTER-MGMT@GOV.IN",
  "sent": "2026-09-09T10:45:00+05:30",
  "status": "Actual",
  "msgType": "Alert",
  "scope": "Public",
  "info": {
    "category": "Geo",
    "event": "Landslide Hazard Warning",
    "urgency": "Immediate",
    "severity": "Extreme",
    "certainty": "Observed",
    "headline": "CRITICAL Landslide Risk Escalation: Chooralmala / Meppadi Sub-Catchment",
    "description": "Antecedent 72h precipitation has exceeded 380mm with soil saturation reaching 94%. Geotechnical Factor of Safety has fallen to 0.88, indicating impending slope failure.",
    "instruction": "Initiate immediate evacuation of settlements along the Iruvanipuzha riverbank and lower slope terraces. Divert traffic from SH-59.",
    "area": {
      "areaDesc": "Chooralmala, Meppadi, Wayanad District, Kerala",
      "circle": "11.5432,76.1245,2.5"
    }
  }
}
```
