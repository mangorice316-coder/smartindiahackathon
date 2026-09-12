# Data Quality Standards & Validation Framework

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Sections 12–15 & Section 41.3  
**Audit Output Location**: `quality/validation_reports/` & `quality/anomaly_reports/`

---

## 1. Overview & Quality Mandate

Machine learning models for life-critical disaster management must not ingest corrupted, fabricated, physically impossible, or unverified data. Every training and validation dataset must undergo automated evaluation across six distinct quality dimensions before admission to the training pipeline.

A dataset is assigned an overall **Composite Quality Score (0–100)**:

$$\text{Score} = 0.25\,Q_{\text{comp}} + 0.25\,Q_{\text{acc}} + 0.20\,Q_{\text{cons}} + 0.15\,Q_{\text{trac}} + 0.10\,Q_{\text{time}} + 0.05\,Q_{\text{rel}}$$

---

## 2. The Six Quality Dimensions

### 2.1 Completeness ($Q_{\text{comp}}$, Weight: 25%)
- **Definition**: The ratio of non-null, fully populated observation values across all mandatory feature dimensions.
- **Target Standard**: Minimum **99.0% completeness** across required GSI susceptibility layers and IMD rainfall fields.
- **Scoring Equation**:
  $$Q_{\text{comp}} = \max\left(0, 100 - \frac{N_{\text{missing}}}{N_{\text{total\_expected}}} \times 100\right)$$
- **Enforcement**: Any column with $> 5.0\%$ missing values triggers an immediate quarantine flag.

### 2.2 Accuracy ($Q_{\text{acc}}$, Weight: 25%)
- **Definition**: Verification that observed values conform to empirical geotechnical and physical laws of nature.
- **Target Standard**: Zero physical bound violations across terrain gradient, pore pressure, and precipitation.
- **Validation Bounds**:
  - Slope: $[0.0^{\circ}, 90.0^{\circ}]$
  - Aspect: $[0.0^{\circ}, 360.0^{\circ}]$
  - 24-hr Rainfall: $[0.0\,\text{mm}, 1200.0\,\text{mm}]$
  - Soil Saturation: $[0.0\%, 100.0\%]$
  - Pore-Water Pressure: $[0.0\,\text{kPa}, 300.0\,\text{kPa}]$
  - InSAR Coherence Loss: $[0.0, 1.0]$

### 2.3 Consistency ($Q_{\text{cons}}$, Weight: 20%)
- **Definition**: Cross-variable logical and physical harmony within each multi-variate observation tuple.
- **Geotechnical & Hydrological Invariant Rules**:
  1. **Precipitation Monotonicity**: 72-hour antecedent rainfall must strictly be greater than or equal to 24-hour rainfall ($API_{72} \ge R_{24}$).
  2. **Suction & Pore Pressure Invariant**: Soil saturation must exceed $30\%$ before positive pore-water pressure ($u_w > 25\,\text{kPa}$) can physically mobilize.
  3. **Mohr-Coulomb Limit Equilibrium**: A factor of safety $FS < 0.70$ on slopes $>35^{\circ}$ must not be assigned a negative non-landslide label in training data.

### 2.4 Traceability ($Q_{\text{trac}}$, Weight: 15%)
- **Definition**: Unbroken cryptographic provenance tracing every feature to its authoritative Tier source.
- **Standard**: Every ingested layer and output dataset must possess an immutable SHA-256 digest registered in `metadata/dataset_catalog.csv` and `metadata/lineage.json`. Datasets lacking cryptographic lineage are automatically rejected.

### 2.5 Timeliness ($Q_{\text{time}}$, Weight: 10%)
- **Definition**: Observational latency relative to the physical process under surveillance.
- **Latency Budgets**:
  - IMD AWS Rainfall Telemetry: $\le 15\,\text{minutes}$
  - Weather Forecast (WRF / IMD GFS): $\le 6\,\text{hours}$
  - Sentinel-1 SAR Radar Passes: $\le 6 - 12\,\text{days}$
  - Static GSI Susceptibility Factors: Annual / Major 5-Year NLSM Baselines

### 2.6 Relevance ($Q_{\text{rel}}$, Weight: 5%)
- **Definition**: Spatial and geological domain compliance with designated Indian landslide-prone mountainous terrains (Western Ghats, North-Western Himalayas, Eastern Himalayas). Coordinates outside Indian territorial boundaries are rejected.

---

## 3. Dataset Quality Classification

Following evaluation by `pipelines/cleaning/quality_checker.py`, each dataset is tagged with one of three official operational statuses:

| Status | Score Threshold | Action & Model Pipeline Behavior |
| :--- | :--- | :--- |
| **`VALID`** | $\text{Score} \ge 85.0$ and 0 critical anomalies | **Approved for Training**: Serialized to `data/processed/` and ingested by `train_versioned_model.py`. |
| **`WARNING`** | $70.0 \le \text{Score} < 85.0$ | **Conditional Review**: Ingestion permitted only with explicit engineering override; flagged features imputed. |
| **`REJECTED`** | $\text{Score} < 70.0$ or $>1$ critical anomaly | **Quarantine**: Processing halted. Ingestion aborted. Anomaly report generated in `quality/anomaly_reports/`. |

---

## 4. Automated Anomaly Quarantine Procedures

When a record or batch triggers a rejection:
1. The batch is segregated into `data/intermediate/quarantine/`.
2. An anomaly record is serialized to `quality/anomaly_reports/anomaly_<dataset>_<timestamp>.json` containing exact row indices, offending feature names, observed values, and expected boundaries.
3. The training pipeline aborts with a non-zero exit code to prevent model pollution.
