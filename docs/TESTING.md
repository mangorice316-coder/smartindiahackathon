# LRIDS Quality Assurance & Testing Suite Reference

> **Landslide Risk Intelligence & Decision Support System (LRIDS)**  
> Test Matrix, Automated Suites, Red-Team Stress Scenarios, and Verification Instructions  
> Status: **15 Test Suites | 122 Tests Passed (100%) | Zero Build Errors**

---

## 1. Quality Assurance Strategy & Test Pyramid

LRIDS is engineered as life-critical disaster decision-support software. The testing strategy enforces strict verification across five operational layers:

```
                  ┌────────────────────────────────────────┐
                  │      DEEP RED-TEAM QA & ATTACKS        │  (10 tests)
                  ├────────────────────────────────────────┤
                  │     RED-TEAM RESILIENCE SCENARIOS      │  (7 tests)
                  ├────────────────────────────────────────┤
                  │     SECURITY & IMMUTABILITY TESTS      │  (11 tests)
                  ├────────────────────────────────────────┤
                  │    INTEGRATION & SIMULATION TESTS      │  (38 tests)
                  ├────────────────────────────────────────┤
                  │     UNIT & GEOTECHNICAL PHYSICS        │  (56 tests)
                  └────────────────────────────────────────┘
```

---

## 2. Complete Test Suite Matrix (15 Test Suites, 122 Tests)

| # | Test Suite File | Domain & Capabilities Tested | Test Count | Status |
|---|---|---|:---:|:---:|
| 01 | `tests/test_foundation.py` | Database connection, table schemas, detailed health latency checks | 6 | **PASSED** |
| 02 | `tests/test_api.py` | Overview KPIs, REST routing, schema validation, 404/422 status | 8 | **PASSED** |
| 03 | `tests/test_data_engine.py` | Telemetry ingestion, $API_{72}$ decaying index, missing data imputation | 9 | **PASSED** |
| 04 | `tests/test_ml_risk_engine.py` | Preprocessing, feature schema alignment, ROC-AUC, Brier score, calibration | 7 | **PASSED** |
| 05 | `tests/test_ml_pipeline.py` | Joblib serialization, model versioning, prediction vectorization | 7 | **PASSED** |
| 06 | `tests/test_risk_engine.py` | Risk score normalization (0–100), configurable threshold overrides | 7 | **PASSED** |
| 07 | `tests/test_slope_stability.py` | Mohr-Coulomb infinite slope stability, pore-water pressure, Factor of Safety | 8 | **PASSED** |
| 08 | `tests/test_gis_command_center.py`| GeoJSON hotspot layer, spatial buffer intersection, lifeline vulnerability | 8 | **PASSED** |
| 09 | `tests/test_alerts_and_inspections.py`| OASIS CAP v1.2 generation, alert escalation, multi-factor priority matrix | 9 | **PASSED** |
| 10 | `tests/test_simulation.py` | Isolated deluge scenarios, LRU scenario cache, difference layer GeoJSON | 8 | **PASSED** |
| 11 | `tests/test_explainable_ai.py` | Saabas tree-path marginal contribution attribution, feature impact cards | 6 | **PASSED** |
| 12 | `tests/test_historical_analytics.py` | Multi-year landslide trends, monsoon seasonality, spatial frequency heatmaps | 6 | **PASSED** |
| 13 | `tests/test_security_hardening.py` | 4 operational roles (RBAC), ORM immutability, SHA-256 model guards, rate limits | 12 | **PASSED** |
| 14 | `tests/test_red_team_qa.py` | 1500mm cloudburst deluge, extreme boundary clipping, alert storm suppression | 7 | **PASSED** |
| 15 | `tests/test_red_team_deep_qa.py` | Extreme geotechnical cliff (89.9°), NaN inputs, latency benchmarks (<500ms) | 10 | **PASSED** |
| **TOTAL** | **15 Suites** | **Complete Decision-Support Platform Verification** | **122** | **100% PASS** |

---

## 3. How to Execute Test Suites

### Run All 122 Backend Tests
```bash
cd backend
python -m pytest tests/ -q
```

### Run Dedicated Red-Team QA & Deep Stress Tests
```bash
python -m pytest tests/test_red_team_qa.py -v
python -m pytest tests/test_red_team_deep_qa.py -v
```

### Run Security Hardening & Immutability Tests
```bash
python -m pytest tests/test_security_hardening.py -v
```

### Verify Frontend TypeScript & Production Build
```bash
cd ../frontend
npm run build
```

---

## 4. Red-Team Stress Scenarios & Expected Outcomes

1. **Extreme 1500 mm Cloudburst Infiltration**:
   * *Scenario*: Saturated soil ($m = 1.0$), extreme slope ($45^\circ$), pore pressure dissipation.
   * *Outcome*: Analytical Factor of Safety drops to $F_s < 1.0$ (UNSTABLE). ML probability caps safely at $1.0$ without numeric overflow or NaN.
2. **Simulation Memory Non-Interference**:
   * *Scenario*: Multiple +200% rainfall deluges triggered in rapid succession.
   * *Outcome*: Baseline `RainfallObservation` and `EnvironmentalObservation` record counts and statistical values remain bitwise identical before and after simulation runs.
3. **Alert Flood Suppression**:
   * *Scenario*: Continuous alert evaluation called 5 times in rapid succession during peak storm.
   * *Outcome*: Alert engine updates existing alerts with timestamp increments rather than spawning duplicate active alerts.
4. **Geospatial Out-of-Bounds Rejection**:
   * *Scenario*: Submitting coordinates outside valid physical geographic boundaries (e.g. Latitude 195.0).
   * *Outcome*: FastAPI request validator immediately returns HTTP 422 Unprocessable Entity with a sanitized error description.
5. **Extreme Cliff Stability (89.9° Slope)**:
   * *Scenario*: Evaluating near-vertical escarpment face under saturated conditions.
   * *Outcome*: Factor of Safety drops to $F_s < 0.5$; hazard score safely clamped to $100.0$ without floating point underflow or divide-by-zero errors.
