# Reproducibility & Pipeline Execution Guide

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Section 30 & Section 41.9  
**Target Architecture**: Zero-Dependency Pipeline (CSV/Parquet Primary, Scikit-Learn Engine)

---

## 1. Deterministic Execution Mandate

All pipeline modules enforce deterministic random states (`random_seed = 42`) across dataset synthesis, negative sample verification, cross-validation partitioning, and gradient boosted tree training. Re-executing the pipeline with identical parameters produces bit-for-bit identical SHA-256 artifacts.

---

## 2. Step-by-Step Pipeline Execution Workflow

To reproduce the complete LRIDS data preparation, quality audit, and model training lifecycle from scratch, execute the following commands in the workspace root:

### Step 1: Generate Metadata & Provenance Registries
Generates `metadata/dataset_catalog.csv`, `metadata/feature_dictionary.csv`, `metadata/source_registry.csv`, and `metadata/lineage.json`:
```bash
python pipelines/generate_metadata_registry.py
```

### Step 2: Build Versioned Harmonized Dataset
Synthesizes and certifies `GSI_ISRO_NLFC_v2.1` adhering to GSI 8 factors, ISRO 80k scars, IMD rainfall, and Mohr-Coulomb geotechnical limits:
```bash
python backend/app/pipeline/dataset_builder.py
```

### Step 3: Run 6-Dimension Data Quality Audit
Evaluates completeness, accuracy, consistency, timeliness, relevance, and traceability; writes audit report to `quality/validation_reports/`:
```bash
python pipelines/cleaning/quality_checker.py
```

### Step 4: Execute Negative Sampling & Spatio-Temporal Partitioning
Partitions into 70% Train, 15% Val, 15% Test with Himalayan spatial holdouts; writes to `data/processed/`:
```bash
python pipelines/labeling/sampling.py
```

### Step 5: Train, Calibrate & Certify Production ML Model
Trains calibrated gradient boosting classifier; produces `backend/ml_models/LRIDS_GSI_ISRO_v2.1.joblib` and cryptographic lineage manifest:
```bash
python backend/app/pipeline/train_versioned_model.py
```

---

## 3. Cryptographic Checksum Reference Verification

Following complete pipeline execution, verify the SHA-256 digests against the certified baseline:

| Artifact | Relative Path | Expected SHA-256 Digest |
| :--- | :--- | :--- |
| **Model Weights** | `backend/ml_models/LRIDS_GSI_ISRO_v2.1.joblib` | `2f099a4e9fa75e911fc9c8ce81637634ae23941f94482ea8860b83a6c3a6fef3` |
| **Primary Dataset**| `backend/data_pipeline/datasets/GSI_ISRO_NLFC_v2.1.csv`| `510c4f8774775d713c77e38ae073860bb63ec0aa01dd92500be8e0c8b9d8ca39` |
| **Training Split** | `data/processed/training.csv` | `bca228fdfcad091a85ea55b68b0befd53cde635ee4b35aa11b1d3aa12d58d2ee` |

---

## 4. Environment & Dependencies

- **Python**: 3.10+
- **Core Libraries**: `numpy`, `pandas`, `scikit-learn`, `joblib`, `fastapi`, `pydantic`
- **Zero Paid APIs**: Uses open NDSAP, Copernicus Open Access, and OpenStreetMap (ODbL 1.0).
- **Parquet/CSV Portability**: Standard CSV with optional Parquet acceleration ensures 100% interoperability without requiring external C++ compiler toolchains.
