# End-to-End Cryptographic Data Lineage & Provenance

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Section 31 & Section 41.5  
**Lineage Graph Registry**: `metadata/lineage.json`

---

## 1. Architectural Mandate: Strict Model Decoupling

LRIDS maintains an immutable physical decoupling between the live telemetry dashboard and the machine learning development lifecycle:

1. **Dashboard Decoupling**: The operational dashboard never trains models on live telemetry streams, nor does it alter model parameters dynamically.
2. **Artifact Delivery**: The training engine produces standalone, versioned, cryptographically certified model bundles (`backend/ml_models/<MODEL_TAG>.joblib`) alongside an accompanying lineage manifest (`<MODEL_TAG>_lineage.json`).
3. **Dashboard Consumption**: The FastAPI backend loads the certified model artifact at startup, verifying its SHA-256 digest against the registered manifest.

---

## 2. Directed Acyclic Graph (DAG) of Data Flow

```mermaid
graph TD
    subgraph Tier 1 & 2: Authoritative Geological Ground Truth
        A1[GSI NLFC Portal WFS] -->|Raw Polygons| B1[data/raw/gsi_nlfc_inventory]
        A2[GSI NLSM Bhukosh] -->|8 Thematic Layers| B2[data/raw/gsi_nlsm_8factors]
        A3[ISRO NRSC Landslide Atlas] -->|80k Historical Scars| B3[data/raw/isro_nrsc_scars]
    end

    subgraph Tier 3, 4 & 5: Dynamic Triggers & Exposure
        C1[IMD AWS Pune / 0.25° NetCDF] -->|Rainfall Telemetry| D1[data/raw/imd_rainfall]
        C2[Copernicus Sentinel-1 SAR] -->|Level-1 GRD SLC| D2[data/raw/sentinel1_sar]
        C3[Copernicus Sentinel-2 Optical] -->|Level-2A BOA| D3[data/raw/sentinel2_optical]
        C4[OpenStreetMap Overpass] -->|Highway & Settlement Polygons| D4[data/raw/osm_infrastructure]
    end

    subgraph Standardization & Cleaning Pipeline
        B1 & B2 & B3 & D1 & D2 & D3 & D4 --> E1[pipelines/cleaning/quality_checker.py]
        E1 -->|Quality >= 85| F1[data/intermediate/harmonized_corpus]
        E1 -->|Quality < 70| F2[quality/anomaly_reports/quarantine]
    end

    subgraph Sampling & Partitioning Engine
        F1 --> G1[pipelines/labeling/sampling.py]
        G1 -->|70% Train| H1[data/processed/training.csv]
        G1 -->|15% Validation| H2[data/processed/validation.csv]
        G1 -->|15% Test| H3[data/processed/test.csv]
    end

    subgraph Model Training & Verification
        H1 & H2 --> I1[backend/app/pipeline/train_versioned_model.py]
        I1 -->|Serialized Weights| J1[backend/ml_models/LRIDS_GSI_ISRO_v2.1.joblib]
        I1 -->|SHA-256 Manifest| J2[backend/ml_models/LRIDS_GSI_ISRO_v2.1_lineage.json]
    end

    subgraph Live Production Serving
        J1 & J2 --> K1[FastAPI ML Inference Service]
        K1 -->|REST API /api/v1/ml/pipeline/lineage| L1[React GIS Dashboard]
    end
```

---

## 3. Cryptographic Verification & Audit Trail

Every serialized artifact is fingerprinted with its full cryptographic SHA-256 hash. The live production server refuses to boot if the calculated hash of the loaded `.joblib` model differs from its lineage manifest:

### 3.1 Active Production Checkpoint Manifest
- **Model Checkpoint**: `LRIDS_GSI_ISRO_v2.1.joblib`
- **Model SHA-256 Digest**:  
  `2f099a4e9fa75e911fc9c8ce81637634ae23941f94482ea8860b83a6c3a6fef3`
- **Source Dataset**: `GSI_ISRO_NLFC_v2.1.csv`
- **Dataset SHA-256 Digest**:  
  `510c4f8774775d713c77e38ae073860bb63ec0aa01dd92500be8e0c8b9d8ca39`
- **Training Algorithm**: Calibrated Gradient Boosting Classifier (Platt Calibrated Sigmoid)
- **Primary Metrics**:
  - ROC-AUC: **$0.9276$**
  - PR-AUC: **$0.8851$**
  - F1-Score: **$0.8428$**
  - Brier Score Loss: **$0.1064$**

---

## 4. Lineage Inspection API

The operational system exposes this cryptographic lineage directly to emergency managers and audit teams via:
```http
GET /api/v1/ml/pipeline/lineage
```
The response returns the complete tier hierarchy, feature dictionaries, dataset SHA-256 hashes, training timestamps, and ODbL attribution credentials in JSON format.
