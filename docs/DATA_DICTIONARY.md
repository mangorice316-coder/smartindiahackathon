# Unified Feature & Variable Data Dictionary

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Section 9 & Section 41.2  
**Target Architecture**: Multi-Model Foundation (Models 1 through 6)

---

## 1. Feature Register by Machine Learning Model

LRIDS operationalizes 6 decoupled models targeting distinct temporal horizons and physical processes:

| Model ID | Model Name | Primary Task | Temporal Scale | Input Feature Dimension |
| :--- | :--- | :--- | :--- | :--- |
| **Model 1** | Static Landslide Susceptibility | Spatial failure susceptibility mapping | Static (30m grid) | GSI 8 factors + TWI |
| **Model 2** | Near-Real-Time Dynamic Risk | Multi-factor risk synthesis | 6-hour refresh | Susceptibility + Dynamic Rainfall + Exposure |
| **Model 3** | Rainfall-Triggered Failure Probability | Hydrological threshold exceedance | Hourly / Daily ($I-D$) | 24h, 72h, $API_{72}$, Rainfall Intensity $I$ |
| **Model 4** | Risk Escalation / Early Warning | Geotechnical acceleration warning | 0–6 hour horizon | Pore pressure rate $du_w/dt$, Saturation $S_r$, Soil Suction |
| **Model 5** | Satellite Surface Change Detection | InSAR coherence loss & scar mapping | 6–12 day satellite pass | Sentinel-1 Coherence $\gamma$, Backscatter $\Delta\sigma^0$, NDVI $\Delta$ |
| **Model 6** | Consequence & Lifeline Exposure | Critical asset & transport vulnerability | On-demand / Real-time | Road proximity $d_{road}$, Population, Critical facilities |

---

## 2. Feature & Target Variable Specifications

### 2.1 Model 1: Static Susceptibility Features (GSI NLSM Standard)

| Feature Name | Type | Unit | Physical Range | Default / Imputation | Geotechnical & Physical Meaning | Source Lineage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `slope` | `float64` | Degrees ($^{\circ}$) | $[0.0, 90.0]$ | Median by sub-catchment | Local topographic terrain gradient derived from 30m DEM. Drives gravitational shear stress $\tau = \gamma z \sin\beta \cos\beta$. | NASA SRTM / ALOS DEM |
| `aspect` | `float64` | Degrees ($^{\circ}$) | $[0.0, 360.0]$ | Circular mean | Compass orientation of downward slope face. Governs exposure to South-West monsoon rain-bearing winds. | NASA SRTM DEM |
| `slope_shape` | `float64` | Dimensionless | $[-2.0, 2.0]$ | `0.0` (Planar) | Profile curvature. Negative values indicate concave hollows that converge subsurface pore water; positive indicates ridges. | Topographic Curvature Filter |
| `lithology_grade` | `int32` | Grade Class | $[1, 5]$ | Mode of geological unit | Weathering grade: 1=Fresh crystalline (granite/charnockite), 2=Slightly weathered, 3=Moderately weathered, 4=Highly weathered saprolite, 5=Residual soil/colluvium. | GSI 1:50,000 Lithology Maps |
| `fault_distance_km` | `float64` | Kilometers | $[0.0, 100.0]$ | Clip max ($100.0$) | Euclidean proximity to verified regional thrust faults, shear zones, or major structural lineaments. | GSI Tectonic Atlas |
| `lineament_density` | `float64` | $\text{km}/\text{km}^2$ | $[0.0, 15.0]$ | `0.0` | Total cumulative length of brittle fracture lineaments per square kilometer. | GSI Structural Layers |
| `geomorphology_unit`| `int32` | Class ID | $[0, 10]$ | `0` (Undifferentiated) | Genetic landform type: 0=Valley Floor, 1=Colluvial Debris Fan, 2=Denudational Slope, 3=Active Escarpment/Scarp. | GSI Geomorphological Atlas |
| `lulc_class` | `int32` | Class ID | $[0, 10]$ | Mode of local cluster | Land Use / Land Cover: 0=Dense Forest Canopy, 1=Degraded Scrub, 2=Tea/Rubber Plantation, 3=Quarry/Road Excavation. | NRSC Bhuvan LULC 2023 |
| `twi` | `float64` | Dimensionless | $[0.0, 30.0]$ | Sub-catchment median | Topographic Wetness Index: $\ln(a / \tan\beta)$. Quantifies steady-state soil moisture pooling potential. | Hydrological Flow Accumulation |

---

### 2.2 Model 2 & Model 3: Dynamic Hydrological & Weather Features (Tier 3 IMD)

| Feature Name | Type | Unit | Physical Range | Default / Imputation | Geotechnical & Physical Meaning | Source Lineage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `rainfall_24h_mm` | `float64` | Millimeters | $[0.0, 1200.0]$ | Inverse Distance Weighting | Total cumulative precipitation over the immediate preceding 24 hours. Instantaneous trigger for shallow debris flows. | IMD AWS Telemetry / 0.25° Grid |
| `rainfall_72h_antecedent_mm` | `float64` | Millimeters | $[0.0, 2500.0]$ | IDW Spatial Interpolation | Cumulative 72-hour rainfall representing medium-term soil moisture accumulation. Hydrological constraint: must be $\ge \text{rainfall\_24h\_mm}$. | IMD AWS Telemetry |
| `rainfall_intensity_max_mm_h` | `float64` | $\text{mm}/\text{h}$ | $[0.0, 250.0]$ | `0.0` | Peak 1-hour rainfall intensity recorded within the monitoring window. Exceeds infiltration capacity inducing overland flow. | IMD Radar & AWS Rain Gauge |
| `soil_saturation_pct` | `float64` | Percentage | $[0.0, 100.0]$ | Calibrated Hydrological Model | Volumetric degree of soil saturation ($S_r$). When $S_r \to 100\%$, matric suction drops to zero and positive pore pressures initiate. | IMD-WRF Hydrological Engine |
| `pore_water_pressure_kpa` | `float64` | Kilopascals | $[0.0, 300.0]$ | Hydrostatic gradient | Positive interstitial pore-water pressure ($u_w$) acting along prospective slip planes. Directly reduces effective normal stress $\sigma'$. | Piezometric In-Situ & Hydrological Model |

---

### 2.3 Model 5: Copernicus Earth Observation Features (Tier 4)

| Feature Name | Type | Unit | Physical Range | Default / Imputation | Geotechnical & Physical Meaning | Source Lineage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `sar_coherence_loss` | `float64` | Dimensionless | $[0.0, 1.0]$ | Forward temporal fill | InSAR complex correlation decay ($1 - \gamma$) between repeat-pass Sentinel-1 C-band acquisitions. Indicates surface mass displacement. | Copernicus Sentinel-1 InSAR |
| `sar_backscatter_diff_db` | `float64` | Decibels (dB) | $[-30.0, 30.0]$ | `0.0` | Temporal differential in VV/VH radar backscattering coefficient ($\Delta\sigma^0$). Distinguishes surface roughening and moisture surges. | Sentinel-1 GRD SAR |
| `ndvi_vegetation_loss` | `float64` | Index Diff | $[-1.0, 1.0]$ | `0.0` | Temporal decrease in Normalized Difference Vegetation Index ($\Delta\text{NDVI}$) due to scarp stripping, debris flow, or runout scouring. | Sentinel-2 MSI Multi-Spectral |

---

### 2.4 Model 6: Consequence & Lifeline Exposure Features (Tier 5 OSM ODbL 1.0)

| Feature Name | Type | Unit | Physical Range | Default / Imputation | Geotechnical & Physical Meaning | Source Lineage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `osm_road_distance_m` | `float64` | Meters | $[0.0, 50000.0]$ | Spatial buffer max | Proximity to national highways (NH), state highways (SH), or arterial hill roads vulnerable to severance. | OpenStreetMap (ODbL 1.0) |
| `osm_settlement_distance_m`| `float64` | Meters | $[0.0, 100000.0]$ | Spatial buffer max | Distance to human habitation, school clusters, hospital lifelines, or tea estate worker barracks. | OpenStreetMap (ODbL 1.0) |

---

### 2.5 Target Variables & Physical Invariants

| Target Name | Type | Domain | Description | Verification Logic |
| :--- | :--- | :--- | :--- | :--- |
| `landslide_occurrence` | `int32` | $\{0, 1\}$ | Binary ground-truth indicator of slope failure. 1 = Confirmed landslide scar/scarp; 0 = Stable terrain control. | Verified against GSI NLFC field inventories & ISRO 80k scars. |
| `risk_severity` | `string` | `{"LOW", "MODERATE", "HIGH", "CRITICAL"}` | Multi-tier early warning classification for emergency management and NDRF operational mobilization. | Physics-calibrated Mohr-Coulomb thresholding and $I-D$ curve exceedance. |
| `geotechnical_fs` | `float64` | $[0.0, 10.0]$ | Geotechnical Factor of Safety ($FS = \tau_{resisting} / \tau_{driving}$). Failure occurs when $FS < 1.0$. | Calculated using infinite slope limit equilibrium formulation. |
