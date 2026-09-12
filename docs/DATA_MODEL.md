# Data Model & Entity Specifications

LRIDS utilizes a strongly-typed, schema-validated relational data model implemented in SQLAlchemy and SQLite/PostgreSQL, paired with GeoJSON feature representations for geospatial GIS layers.

---

## Entity Relationship Overview

```
┌─────────────────┐       1:N       ┌─────────────────────┐
│    RiskZone     │────────────────<│    SensorReading    │
└─────────────────┘                 └─────────────────────┘
         │ 1:N                                 │ 1:N
         │                                     │
         ▼                                     ▼
┌─────────────────┐       1:N       ┌─────────────────────┐
│      Alert      │────────────────<│   InspectionTask    │
└─────────────────┘                 └─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐                 ┌─────────────────────┐
│   AuditLedger   │                 │    ModelVersion     │
└─────────────────┘                 └─────────────────────┘
```

---

## Core Relational Tables

### 1. `risk_zones`
Spatial catchment polygons and hillside monitoring sectors.
- `id` (Integer, Primary Key)
- `name` (String, Indexed): Location name (e.g. *Meppadi Upper Crest Line*).
- `district` (String): Administrative district (e.g. *Wayanad*, *Idukki*, *Nilgiris*).
- `latitude`, `longitude` (Float): Centroid coordinates in WGS 84.
- `slope_deg` (Float): Topographic inclination in degrees ($0^\circ - 90^\circ$).
- `aspect_deg` (Float): Compass orientation ($0^\circ - 360^\circ$).
- `soil_cohesion_kpa` (Float): Effective cohesion $c'$.
- `friction_angle_deg` (Float): Internal friction angle $\phi'$.
- `soil_depth_m` (Float): Colluvium mantle depth.
- `population_density` (Float): Residents per square kilometer.
- `land_cover` (String): LULC classification (*tea_estate*, *dense_forest*, *settlement*).
- `lithology` (String): Bedrock type (*charnockite*, *khondalite*, *gneiss*).

### 2. `sensor_readings`
Time-series hydro-meteorological and in-situ sensor telemetry.
- `id` (Integer, Primary Key)
- `location_id` (Integer, Foreign Key `risk_zones.id`)
- `timestamp` (DateTime, UTC): Telemetry observation time.
- `rainfall_1h_mm` (Float): Instantaneous precipitation rate.
- `rainfall_24h_mm` (Float): Diurnal precipitation total.
- `rainfall_72h_antecedent_mm` (Float): Antecedent precipitation index ($API_{72}$).
- `soil_moisture_pct` (Float): Volumetric water content ($0\% - 100\%$).
- `pore_water_pressure_kpa` (Float): Positive pore pressure ($u$).
- `displacement_rate_mm_h` (Float): Surface displacement velocity.
- `tilt_angle_deg` (Float): Borehole inclinometer inclination.

### 3. `alerts`
Automated multi-channel early warning notices.
- `id` (Integer, Primary Key)
- `location_id` (Integer, Foreign Key `risk_zones.id`)
- `severity` (String): `CRITICAL`, `HIGH`, `MODERATE`, `LOW`.
- `title` (String): Operational directive headline.
- `message` (Text): Technical justification and geotechnical rationale.
- `created_at` (DateTime, UTC)
- `is_acknowledged` (Boolean)
- `acknowledged_by` (String, Optional)
- `acknowledged_at` (DateTime, Optional)

### 4. `inspection_tasks`
Field patrol ground verification assignments.
- `id` (Integer, Primary Key)
- `location_id` (Integer, Foreign Key `risk_zones.id`)
- `priority` (String): `P1_IMMEDIATE`, `P2_HIGH`, `P3_STANDARD`.
- `status` (String): `DISPATCHED`, `IN_PROGRESS`, `VERIFIED`, `RESOLVED`.
- `assigned_to` (String): Field engineer / patrol unit identifier.
- `crack_width_mm` (Float, Optional): Surface tension crack aperture.
- `seepage_observed` (Boolean, Optional): Hydrostatic seepage discharge.
- `evidence_notes` (Text, Optional)

### 5. `model_versions`
Decoupled machine learning model checkpoints and lineage metadata.
- `id` (Integer, Primary Key)
- `version_tag` (String, Unique): e.g., `LRIDS_GSI_ISRO_v2.1`.
- `algorithm` (String): `HistGradientBoostingClassifier`.
- `dataset_version` (String): `GSI_ISRO_NLFC_v2.1`.
- `sha256_checksum` (String): Cryptographic integrity hash.
- `roc_auc` (Float): Test holdout ROC-AUC score.
- `pr_auc` (Float): Precision-Recall AUC score.
- `f1_score` (Float): Balanced F1 score.
- `brier_score` (Float): Calibration loss.
- `is_active` (Boolean): Active inference status in C2 runtime.
- `training_timestamp` (DateTime, UTC)\n