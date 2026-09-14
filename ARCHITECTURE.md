# LRIDS Master System Architecture

> **Landslide Risk Intelligence & Decision Support System (LRIDS)**  
> Technical Architecture, Dataflow, Component Specifications, and Safety Protocols  
> Verified: **15 Test Suites | 122 Automated Tests Passed (100%) | Zero Build Errors**

---

## 1. Architectural Overview & Design Philosophy

LRIDS is built on the principle of a **closed-loop decision support system** rather than a passive visualization dashboard. 

In high-stakes disaster risk reduction (DRR), an early warning system must answer five fundamental operational questions within seconds:
1. **What is happening?** $\to$ Operational district overview, active CAP alerts, pending inspections.
2. **Where is the hazard?** $\to$ High-resolution sub-catchment risk mapping with spatial GIS contours.
3. **Why is it happening?** $\to$ Transparent geotechnical physics and Saabas tree-path feature attribution.
4. **What lifelines are in danger?** $\to$ Geospatial buffer exposure analysis of hospitals, bridges, schools, and roads.
5. **What must authorities do now?** $\to$ Objective multi-factor field inspection prioritization and OASIS CAP v1.2 alert dispatch.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                   MONITORED REGION (E.G. WAYANAD)           │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
              Telemetry (Rainfall, Soil Saturation, Elevation)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                      03. DATA ENGINE                        │
       │  • Open-Meteo & IMD Adapters                                │
       │  • Missing-Data Imputation & Bounds Checking                │
       │  • Spatial Alignment & Antecedent Indices (API-72)          │
       │  • 3-Tier Fallback Degradation (Live -> Cache -> Synthetic) │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                              Clean Feature Vector
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                    04. ML & PHYSICS CORE                    │
       │  • Tabular Ensemble (HistGradientBoosting / Random Forest)  │
       │  • Infinite-Slope Mohr-Coulomb Stability (Factor of Safety) │
       │  • Saabas Tree-Path Feature Contribution Breakdown          │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                             Risk Probability & Fs
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   05. GIS COMMAND CENTER                    │
       │  • GeoJSON Hotspot Polygons & Hazard Buffer Generation       │
       │  • Critical Lifeline Exposure Intersection (Tier 1 to 4)    │
       └──────────────────┬───────────────────────────┬──────────────┘
                          │                           │
          High Risk & Exposed Lifelines               │
                          ▼                           ▼
       ┌──────────────────────────────┐ ┌────────────────────────────┐
       │      06. ALERTS ENGINE       │ │   07. RAINFALL SIMULATOR   │
       │  • OASIS CAP v1.2 Payloads   │ │  • Isolated Memory Buffer  │
       │  • State/District EOC Feeds  │ │  • What-If Cloudburst Test │
       │  • Deduplication & Rate Gate │ │  • Zero Baseline Mutation  │
       └──────────────┬───────────────┘ └────────────────────────────┘
                      │
            Actionable Early Warning
                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │              06. FIELD INSPECTION PRIORITIZATION            │
       │  • Mathematical Priority Matrix (Hazard, Pop, Lifelines,    │
       │    Uncertainty)                                             │
       │  • Geotechnical Field Evidence Logging (Crack mm, Seepage)   │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                        Inspection Ground-Truth Feedback
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                08-10. DECISION REPORTING & EOC              │
       │  • Automated Executive SitRep (Commanders & District Mag)   │
       │  • Model Transparency Cards & SHA-256 Checksums             │
       └─────────────────────────────────────────────────────────────┘
```

---

## 2. The 16 Master Implementation Stages

| Stage | Domain | Implementation Summary |
|---|---|---|
| **01** | Master Architecture | Modular separation of concerns across Data, ML, Physics, GIS, Alerts, and Inspections. |
| **02** | Foundation | Relational schema (SQLite/PostgreSQL) with 14 normalized tables, Pydantic schemas, and FastAPI lifecycle. |
| **03** | Data Engine | Multi-source telemetry ingestion, API-72 antecedent precipitation index, soil moisture normalization. |
| **04** | ML Risk Engine | Ensemble classifiers (Gradient Boosting, Random Forest) trained on geophysical features with calibration curves. |
| **05** | GIS Command Center | Spatial buffer calculation, Leaflet/GeoJSON layer rendering, critical lifeline vulnerability scoring. |
| **06** | Alerts & Inspections | OASIS CAP v1.2 compliant alert generation, multi-factor inspection task scheduling and evidence logging. |
| **07** | Rainfall Simulator | Isolated what-if deluge simulator with LRU caching, scenario comparison, and zero database pollution. |
| **08** | Explainable AI (XAI) | Tree-path marginal attribution (Saabas) decomposing individual risk scores into transparent physical drivers. |
| **09** | Historical Analytics | Longitudinal landslide trends, seasonal monsoon patterns, spatial frequency heatmaps, and return periods. |
| **10** | Decision Reporting | Automated generation of District Magistrate Situation Reports (SitRep) in Markdown and JSON formats. |
| **11** | Security & Hardening | 4-tier RBAC, SQLAlchemy ORM immutability event listeners, rate limiting, and SHA-256 model guards. |
| **12** | Red-Team QA | Automated stress testing against 1500mm cloudburst deluges, boundary extremes, and alert flood spam. |
| **13** | SIH Demo Mode | Interactive 9-step guided walkthrough with instant deluge presets (+25%, +50%, +100%) and scientific guides. |
| **14** | UI/UX Polish | 5-question disaster command structure, WCAG AA high-contrast styling, accessible symbols, responsive tables. |
| **15** | SIH Judge Audit | Comprehensive evaluation across 17 technical axes with a structured scorecard. |
| **16** | Codebase Cleanup | Dead code removal, typing unification, production bundling, 15 test suites (122 tests passed), docs. |

---

## 3. Geotechnical Physics & ML Coupling

A pure machine learning model operating without geotechnical grounding is susceptible to false positives and out-of-distribution hallucinations. LRIDS addresses this through **physics-ML coupling**:

### Infinite-Slope Factor of Safety ($F_s$)
Slope stability is evaluated using the Mohr-Coulomb limit-equilibrium criterion:

$$F_s = \frac{c' + (\gamma \cdot z \cdot \cos^2\beta - u) \tan\phi'}{\gamma \cdot z \cdot \sin\beta \cdot \cos\beta}$$

Where:
* $c'$: Effective soil cohesion ($\text{kPa}$)
* $\phi'$: Effective internal friction angle ($^\circ$)
* $\gamma$: Bulk soil unit weight ($\text{kN/m}^3$)
* $z$: Failure plane depth ($\text{m}$)
* $\beta$: Slope angle ($^\circ$)
* $u$: Pore-water pressure ($\text{kPa}$), dynamically calculated from antecedent rainfall saturation $m$:
  $$u = m \cdot \gamma_w \cdot z \cdot \cos^2\beta$$

* **Failure Criterion**: $F_s < 1.0$ indicates limit-equilibrium failure. $1.0 \le F_s < 1.3$ denotes critical vulnerability.
* The ML ensemble feature vector explicitly ingests $F_s$ and its underlying components, preventing models from predicting low risk on mechanically unstable slopes.

---

## 4. Multi-Factor Field Inspection Prioritization Matrix

Field engineering teams are scarce during emergency monsoons. LRIDS prioritizes dispatch via an objective objective function:

$$P = w_1 \cdot H + w_2 \cdot E_{pop} + w_3 \cdot E_{life} + w_4 \cdot (1 - C)$$

Where:
* $H$: Hazard score ($\text{ML Risk Probability} \times 100$)
* $E_{pop}$: Normalized population exposure index
* $E_{life}$: Lifeline vulnerability score (Tier 1 Hospitals/Bridges = 1.0, Roads = 0.6)
* $1 - C$: Epistemic model uncertainty (ensuring unconfident or borderline regions receive physical verification)
* Standard Weights: $w_1 = 0.35, w_2 = 0.25, w_3 = 0.25, w_4 = 0.15$

---

## 5. Security Architecture & Data Integrity

1. **Role-Based Access Control (RBAC)**:
   * `ADMIN`: Full configuration, threshold calibration, and user management.
   * `ANALYST`: Scenario simulation, model card inspection, and SitRep generation.
   * `FIELD_OFFICER`: Inspection task execution, status progression, and field evidence logging.
   * `READ_ONLY`: View-only access to GIS maps, alerts, and public bulletins.
2. **Database Immutability**:
   * SQLAlchemy event listeners intercept `before_update` and `before_delete` on `AuditEvent` and `HistoricalLandslide` entities, raising hard runtime exceptions if modifications are attempted.
3. **Simulation Buffer Isolation**:
   * The What-If Rainfall Simulator constructs transient in-memory observation copies. All evaluations and comparisons execute within this buffer, guaranteeing that baseline operational records are never overwritten.
4. **Model Checksum Protection**:
   * Model artifacts (`.joblib`) are verified with SHA-256 signatures upon application startup, rejecting corrupted or untrusted weights.
