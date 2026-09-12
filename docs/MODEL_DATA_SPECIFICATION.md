# Machine Learning Model Data Specifications

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Sections 4, 21–26 & Section 41.8  
**Models Covered**: Models 1 through 6

---

## 1. Model 1: Static Landslide Susceptibility Model

- **Primary Mission**: Predict static spatial propensity for slope failure across mountain catchments at 30m grid resolution.
- **Input Features**: GSI 8 Core Factors (`slope`, `aspect`, `slope_shape`, `lithology_grade`, `fault_distance_km`, `lineament_density`, `geomorphology_unit`, `lulc_class`) + `twi`.
- **Target Variable**: `landslide_occurrence` (Binary $\{0, 1\}$).
- **Algorithm Foundation**: Spatial Gradient Boosted Trees / Random Forest.
- **Performance Benchmark**:
  - Minimum ROC-AUC: $\ge 0.88$
  - Spatial generalizability: $\ge 0.82$ ROC-AUC on Himalayan holdouts.

---

## 2. Model 2: Near-Real-Time Dynamic Risk Model

- **Primary Mission**: Dynamic 6-hour risk index synthesis synthesizing terrain susceptibility, immediate weather triggers, and antecedent moisture.
- **Input Features**: Susceptibility probability ($P_{\text{susc}}$) + `rainfall_24h_mm` + `rainfall_72h_antecedent_mm` + `soil_saturation_pct` + `pore_water_pressure_kpa`.
- **Target Variable**: Multi-tier operational warning status (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
- **Algorithm Foundation**: Platt-Calibrated Gradient Boosting Classifier.
- **Performance Benchmark**:
  - Brier Score: $\le 0.12$
  - True Positive Warning Rate: $\ge 85\%$ on high/critical events.

---

## 3. Model 3: Rainfall-Triggered Failure Probability Model

- **Primary Mission**: Calculate instantaneous failure probability driven by empirical and physical Rainfall Intensity-Duration ($I-D$) curve exceedances.
- **Input Features**: `rainfall_intensity_max_mm_h`, `rainfall_24h_mm`, `rainfall_72h_antecedent_mm`, $API_{72}$, Cumulative Seasonal Monsoon Ratio.
- **Target Variable**: Instantaneous Failure Probability ($P_{\text{fail}} \in [0.0, 1.0]$).
- **Physical Baseline**: Caine (1980) & GSI Regional $I-D$ Threshold: $I = \alpha D^{-\beta}$.
- **Performance Benchmark**:
  - Precision-Recall AUC: $\ge 0.85$
  - False Alarm Rate: $\le 15\%$ during active monsoons.

---

## 4. Model 4: Risk Escalation & Short-Horizon Early Warning Model

- **Primary Mission**: Real-time 0–6 hour lead-time early warning predicting imminent slope collapse acceleration.
- **Input Features**: Telemetry rate of pore-water pressure change ($\Delta u_w / \Delta t$), rate of soil saturation acceleration ($\Delta S_r / \Delta t$), surface displacement velocity from ground extensometers / tiltmeters.
- **Target Variable**: Imminent Failure Binary Event ($t_{\text{lead}} \in [0, 6\,\text{hours}]$).
- **Algorithm Foundation**: Temporal Sequence / Recurrent Physics-Informed LSTM or XGBoost on rolling delta features.
- **Performance Benchmark**:
  - Minimum lead time: $\ge 2\,\text{hours}$ before catastrophic rupture
  - Recall on critical collapses: $\ge 90\%$.

---

## 5. Model 5: Satellite Earth Observation Surface Change Detection

- **Primary Mission**: All-weather post-event scar detection, runout mapping, and pre-failure creep surveillance.
- **Input Features**: Copernicus Sentinel-1 InSAR coherence decay ($\Delta\gamma$), Sentinel-1 VV/VH backscatter change ($\Delta\sigma^0$), Sentinel-2 optical NDVI deficit ($\Delta\text{NDVI}$).
- **Target Variable**: Scar polygon delineation and surface rupture probability.
- **Algorithm Foundation**: SAR change detection U-Net / Multi-modal Transformer.
- **Performance Benchmark**:
  - Intersection-over-Union (IoU) on scar polygons: $\ge 0.72$
  - Detection rate under dense cloud cover (radar only): $\ge 80\%$.

---

## 6. Model 6: Consequence & Lifeline Exposure Model

- **Primary Mission**: Quantify human and economic consequences of prospective slope failure on infrastructure corridors and human settlements.
- **Input Features**: `osm_road_distance_m`, `osm_settlement_distance_m`, National Highway (NH) critical lifeline classification, bridge proximity, school/hospital density.
- **Target Variable**: Consequence Score (0–100) & Evacuation Priority Index.
- **Algorithm Foundation**: Spatial Network Graph Analysis & Analytical Hierarchy Process (AHP).
- **Performance Benchmark**:
  - 100% identification of single-access road cutoffs for isolated mountain settlements.
