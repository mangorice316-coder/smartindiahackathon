# Data Update & Continuous Refresh Policy

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Sections 32, 33 & Section 41.7  
**Governance Protocol**: Multi-Cadence Synchronization & Concept Drift Monitoring

---

## 1. Multi-Tier Update Cadence Matrix

Dynamic disaster management necessitates synchronizing diverse observational streams ranging from sub-hourly sensor telemetry to decadal geological surveys:

| Stream Tier | Source Layer | Native Refresh Cadence | LRIDS Ingestion Cadence | Automated Trigger Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | GSI NLFC National Inventory | Event-driven / Daily monsoonal | Daily at 06:00 UTC during monsoon (June–Oct) | Automated WFS sync script |
| **Tier 1** | GSI NLSM 8 Factor Layers | 5-Year Major Revision | Annual verification audit | Manual engineering review |
| **Tier 2** | ISRO NRSC Landslide Atlas | Annual Post-Monsoon Update | Bi-annual reconciliation | Bhuvan sync pipeline |
| **Tier 3** | IMD AWS Weather Stations | 15 Minutes Real-Time | 15 Minutes Real-Time | Streaming REST API polling |
| **Tier 3** | IMD 0.25° Gridded Rainfall | Daily at 03:00 UTC | Daily at 04:00 UTC | NetCDF automated parser |
| **Tier 4** | Copernicus Sentinel-1 SAR | 6 to 12 Days (Orbit pass) | Within 3 hours of ESA hub availability | Copernicus Data Space API Webhook |
| **Tier 4** | Copernicus Sentinel-2 Optical | 5 Days Constellation Repeat | Daily check (cloud filter $<20\%$) | Copernicus Data Space API Webhook |
| **Tier 5** | OpenStreetMap Lifelines | Continuous crowdsourcing | Weekly differential tile extract | Overpass QL cron worker |

---

## 2. Schema Evolution & Migration Rules

1. **Additive Changes**: Introducing new predictive features (e.g. soil temperature or InSAR phase velocity) is permitted without invalidating existing checkpoints. New columns must default to valid neutral values.
2. **Deprecation Policy**: No existing GSI 8 core factor may be removed or renamed. If an upstream agency alters nomenclature, a compatibility mapping adapter must be registered in `pipelines/cleaning/`.
3. **Semantic Versioning**:
   - `MAJOR`: Fundamental redefinition of geotechnical targets or input dimensions (e.g. v2.0 $\to$ v3.0).
   - `MINOR`: Addition of supplementary satellite bands or weather indices (e.g. v2.1 $\to$ v2.2).
   - `PATCH`: Anomaly fixes, re-calibrated bounds, or improved imputation rules (e.g. v2.1.0 $\to$ v2.1.1).

---

## 3. Automated Model Retraining Triggers

Model weights are never retrained on live dashboard telemetry. Retraining occurs in the decoupled offline pipeline under the following explicit criteria:

1. **Monsoon Season Conclusion**: Following the end of each annual South-West monsoon season (November 1st), GSI and ISRO release certified post-disaster inventories. A new training run is initiated incorporating the newly validated scars.
2. **Concept Drift Exceedance**:
   - Population Stability Index ($PSI > 0.25$) on input rainfall or soil moisture distributions across 30 consecutive days.
   - Brier score degradation $> 0.15$ on recent field-validated events.
3. **Geotechnical Threshold Calibration**: Retraining triggered if regional geotechnical drilling yields revised bedrock cohesion or friction angle parameters.
