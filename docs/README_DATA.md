# Landslide Risk Intelligence System — Real Data Pipeline Specification

**Version**: `5-TIER-GSI-ISRO-v2.1`  
**Classification**: Government Scientific & Open Geospatial Integration  
**Authoring Team**: Senior Geospatial Data Engineer, Remote Sensing Scientist, ML Engineer, Hydrologist  

---

## 1. Pipeline Architecture & Decoupling Mandate

The LRIDS data pipeline is strictly decoupled from the operational dashboard:

```
[TIER 1: GSI Ground Truth] ──┐
[TIER 2: ISRO NRSC Atlas]   ──┼──> pipelines/ingestion/ ──> data/raw/
[TIER 3: IMD Weather AWS]   ──┤          │
[TIER 4: Copernicus Radar]  ──┤          ▼
[TIER 5: OSM Lifelines]     ──┘   pipelines/cleaning/   ──> quality/ & data/intermediate/
                                         │
                                         ▼
                                  pipelines/labeling/   ──> data/processed/ (70/15/15)
                                         │
                                         ▼
                                  pipelines/training/   ──> models/ & evaluation_report.html
                                                                 │
                                                                 ▼
                                                  [Production FastAPI Server]
                                                                 │
                                                                 ▼
                                                    [Operational Dashboard]
```

### Critical Rules
- **No Simulated Data as Real Data**: Every dataset record is tagged with its official data state:
  `LIVE`, `HISTORICAL`, `CACHED`, `STALE`, `SIMULATED`, or `MODEL_OUTPUT`.
- **No Fabrication**: Missing attributes retain explicit `null` values; no numbers are invented.
- **Physical Invariants Enforced**:
  - $API_{72} \ge R_{24}$
  - Positive pore-water pressure ($u_w > 0$) strictly bounded to $S_r \ge 35\%$.
  - Mohr-Coulomb limit equilibrium equation governs geotechnical Factor of Safety:
    $$FS = \frac{c' + (\sigma - u_w)\tan\phi'}{\gamma z \sin\beta \cos\beta}$$

---

## 2. Directory Structure

```
data/
├── raw/
│   ├── landslides/        # Real harvested disaster records (authoritative_landslides_raw.json)
│   ├── rainfall/          # Hourly AWS & daily gridded observations
│   ├── dem/               # 30m NASA SRTM / ALOS terrain tiles
│   ├── geology/           # GSI lithology, fault, and structural vectors
│   ├── soil/              # ICAR soil depth and hydraulic conductivity
│   ├── landcover/         # NRSC Bhuvan 10m LULC rasters
│   ├── satellite/         # Sentinel-1 SAR SLC/GRD & Sentinel-2 L2A
│   ├── hydrology/         # River networks, drainage vectors, flow accumulation
│   └── infrastructure/    # OSM highways, bridges, hospitals, shelters
│
├── processed/
│   ├── landslide_inventory/  # landslide_inventory.parquet & .csv
│   └── training_samples/     # training_samples, validation_samples, test_samples (.parquet & .csv)
│
metadata/
├── dataset_catalog.csv       # 17-attribute catalog for all 8 authoritative datasets
├── feature_dictionary.csv    # 11-attribute dictionary across 29 predictive features
├── source_registry.csv       # Official licensing terms (NDSAP, ODbL 1.0, Copernicus)
└── lineage.json              # Cryptographic DAG tracing raw sources to model checkpoints
│
quality_reports/
├── data_quality_report.html  # 12-check interactive audit report (99.8/100, VALID)
├── data_quality_report.json  # Machine-readable evaluation output
└── evaluation_report.html    # Comparative benchmark & explainability report
│
models/
├── LRIDS_production_baseline.joblib  # Certified calibrated gradient boosting model
├── model_feature_importance.csv      # Top associated predictive factors
└── experiments.json                  # Immutable experiment tracking ledger
```

---

## 3. Step-by-Step Execution Workflow

To reproduce the data pipeline and model training from scratch:

```bash
# 1. Harvest real landslide records and historical weather
python pipelines/ingestion/harvest_authoritative_sources.py

# 2. Run preprocessing, negative sampling, and spatio-temporal holdouts
python pipelines/preprocessing_pipeline.py

# 3. Generate data quality audit reports
python pipelines/cleaning/generate_quality_reports.py

# 4. Train multi-model baselines and certify production weights
python pipelines/training_pipeline.py
```

---

## 5. Spatio-Temporal Leakage Prevention

- **Spatial Holdout**: Models are trained on Western Ghats catchments (Kerala, Maharashtra, Karnataka, Tamil Nadu) and evaluated on held-out **Himalayan mountain belts** (Uttarakhand, Himachal Pradesh, Sikkim) to test genuine spatial transferability.
- **Temporal Holdout**: Feature timestamps strictly precede event occurrences; zero future information is permitted.
