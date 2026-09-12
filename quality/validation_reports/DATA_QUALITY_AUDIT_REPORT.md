# Landslide Early Warning ML Data Quality Audit

**Dataset**: `GSI_ISRO_NLFC_v2.1`  
**Evaluation Timestamp**: `2026-09-12T05:32:59.470297+00:00`  
**Total Assessed Records**: `6,000`  
**Composite Quality Score**: **99.05 / 100**  
**Audit Classification**: **`VALID`**

---

## 1. Quality Dimensions Breakdown

| Dimension | Target Metric | Score | Status |
| :--- | :--- | :--- | :--- |
| **Completeness** | Missing value ratio < 1.0% | **100.0%** | PASS |
| **Accuracy** | Physical limits & geotechnical domain | **99.98%** | PASS |
| **Consistency** | Geotechnical & hydrological invariants | **97.52%** | PASS |
| **Timeliness** | Refresh cadence & latency budget | **96.5%** | PASS |
| **Relevance** | Indian mountain terrain bounding box | **98.0%** | PASS |
| **Traceability** | Cryptographic SHA-256 & Source Registry | **100.0%** | PASS |

---

## 2. Geotechnical Invariants Verified
1. **$I-D$ Rainfall Constraint**: 72-hour antecedent precipitation strictly greater than or equal to instantaneous 24-hour accumulation ($API_{72} \ge R_{24}$).
2. **Pore-Water Saturation Rule**: Suction loss and positive pore-water pressure ($u_w > 0$) strictly bounded to saturation regimes exceeding $S_r \ge 35\%$.
3. **Mohr-Coulomb Limit Equilibrium**: Normal effective stress $\sigma' = \sigma - u_w \ge 0$ maintains physical friction mobilization without negative stress artifacts.
4. **Sentinel-1 SAR C-Band Physics**: InSAR coherence loss and backscatter intensity decay validated against precipitation events.

---

## 3. Detected Anomalies
- Total Anomaly Flags: **2**

- **Flag 1**: `PHYSICAL_BOUND_VIOLATION` - geotechnical_fs (Count: 27)
- **Flag 2**: `PHYSICS_LABEL_CONTRADICTION` - Geotechnical Factor of Safety critically low (<0.70) yet labeled non-landslide (Count: 149)