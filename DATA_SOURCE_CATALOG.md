# Official Data Source Catalog & 5-Tier Architecture

## Landslide Risk Intelligence & Early Warning System (LRIDS)

### Overview
This catalog formalizes the multi-agency geospatial and geotechnical data architecture grounding the LRIDS platform. To ensure scientific integrity, transparency, and operational reliability during catastrophic monsoon events, all datasets adhere strictly to official Indian and international standards.

---

## The 5-Tier Data Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│              5-TIER DATA HIERARCHY FOR LANDSLIDE RISK                   │
├─────────┬──────────────────────────────────┬────────────────────────────┤
│ TIER 1  │ GSI NLFC Ground Truth            │ Labels & 8 LHSZ Factors    │
│ TIER 2  │ ISRO NRSC Landslide Atlas        │ ~80,000 Historical Events  │
│ TIER 3  │ IMD Weather & Climatology        │ Dynamic Antecedent Triggers│
│ TIER 4  │ Copernicus Sentinel-1 SAR & S2   │ All-Weather Cloudburst Def.│
│ TIER 5  │ OpenStreetMap (ODbL 1.0) & PWD   │ Critical Lifeline Networks │
└─────────┴──────────────────────────────────┴────────────────────────────┘
```

---

### Tier 1: Geological Survey of India (GSI) - NLFC
- **Lead Agency**: Geological Survey of India (GSI) - National Landslide Forecasting Centre (NLFC), Kolkata
- **Operational Role**: Ground truth labels and static terrain susceptibility baseline
- **Primary Products**:
  - National Landslide Susceptibility Mapping (NLSM) 1:50,000 Macro-Zonation
  - Field-validated inventory and crown-crack dilatancy records
  - Geotechnical laboratory shear strength parameters ($c'$, $\phi'$, $\gamma_{dry}$, $\gamma_{sat}$)
- **The 8 GSI NLFC Susceptibility Factors**:
  1. **Slope Gradient ($^\circ$)**: Inclination from high-resolution DEM; $> 35^\circ$ marks acute gravitational shear stress.
  2. **Slope Aspect**: Compass orientation ($0^\circ - 360^\circ$) controlling SW monsoon windward precipitation interception.
  3. **Slope Shape / Curvature**: Profile and planform curvature index; concave hollows concentrate subsurface pore pressures.
  4. **Lithology & Weathering**: Bedrock type (Charnockite, Khondalite, Gneiss) and Grade I-VI saprolite decay depth.
  5. **Structural Discontinuities**: Distance to shear faults and lineament density ($km/km^2$).
  6. **Geomorphology Unit**: Landform classification (escarpments, paleo-scars, colluvial fans, talus slopes).
  7. **Land Use & Land Cover (LULC)**: Root-binding cohesion (dense forest) vs. anthropogenic destabilization (tea cuts, quarries).
  8. **Geohydrology**: Topographic Wetness Index ($TWI = \ln(a / 	an eta)$) and perennial drainage line density.
- **Access & License**: Government of India Open Data / GSI Official Scientific Portal

---

### Tier 2: ISRO / NRSC Landslide Atlas of India
- **Lead Agency**: National Remote Sensing Centre (NRSC) / Indian Space Research Organisation (ISRO), Hyderabad
- **Operational Role**: Multi-decadal spatial-temporal training corpus and regional risk exposure catalog
- **Primary Products**:
  - Landslide Atlas of India (1998–2022) Geo-Database (~80,000 mapped landslides)
  - Seasonal, event-based, and route-wise landslide inventories across 17 States and 2 Union Territories
  - Socio-economic exposure indices, damage classifications, and runout zones
- **Scientific Value**: Provides high-volume historical training samples without artificial label fabrication.
- **Access & License**: ISRO Bhuvan Geo-Platform Public Scientific License

---

### Tier 3: India Meteorological Department (IMD)
- **Lead Agency**: India Meteorological Department (IMD), Ministry of Earth Sciences & data.gov.in
- **Operational Role**: Dynamic hydro-meteorological triggering variables and live precipitation telemetry
- **Primary Products**:
  - IMD $0.25^\circ 	imes 0.25^\circ$ Daily Gridded Rainfall
  - Real-Time Automated Weather Station (AWS) 15-minute streams
  - Antecedent Precipitation Indices: $API_{24h}$, $API_{48h}$, $API_{72h}$
  - Rainfall Intensity-Duration (I-D) dynamic threshold exceedance
- **Access & License**: National Data Sharing and Accessibility Policy (NDSAP) / Open Government Data License India

---

### Tier 4: Copernicus Data Space Sentinel-1 SAR & Sentinel-2 MSI
- **Lead Agency**: European Space Agency (ESA) / European Commission
- **Operational Role**: All-weather cloud-penetrating radar deformation and optical post-disaster scar mapping
- **Primary Products**:
  - **Sentinel-1 C-Band SAR (12-day repeat)**: Day/night, all-weather microwave radar backscatter ($VV/VH$) and interferometric coherence loss ($InSAR$). **Crucial Monsoon Advantage**: C-band radar penetrates 100% thick monsoon cloud cover when optical sensors (cameras/satellites) are completely blinded by torrential downpours.
  - **Sentinel-2 MSI (5-day repeat)**: Multispectral Level-2A surface reflectance, Normalized Difference Vegetation Index ($NDVI$) drop, and barren scar demarcation.
- **Access & License**: Copernicus Open Access Policy (CC BY-SA 4.0)

---

### Tier 5: OpenStreetMap (OSM) Infrastructure & NHAI / PWD Corridors
- **Lead Agency**: OpenStreetMap Contributors & State Public Works Departments (PWD / NHAI)
- **Operational Role**: Lifeline network vulnerability, road disruption modeling, and evacuation staging
- **Primary Products**:
  - Highway and mountain pass corridors (NH-766, SH-59, Meppadi-Chooralmala corridor)
  - Bridge abutments, culverts, river crossings, and slope-toe excavations
  - Critical infrastructure centroids (hospitals, schools, designated relief shelters)
- **Mandatory Legal Attribution**:
  > *"Base data © OpenStreetMap contributors under ODbL 1.0 | Geological Survey of India (GSI) NLFC | ISRO NRSC Landslide Atlas | Copernicus Data Space"*
- **License**: Open Database License (ODbL) 1.0 (https://opendatacommons.org/licenses/odbl/1.0/)

---

## Strict Model/Dashboard Decoupling Architecture

```
                                OFFLINE PIPELINE
                                ────────────────
[Tier 1 GSI]    [Tier 2 ISRO]    [Tier 3 IMD]    [Tier 4 SAR]    [Tier 5 OSM]
      │               │                │               │               │
      └───────────────┼────────────────┼───────────────┼───────────────┘
                      ▼
        backend/app/pipeline/dataset_builder.py
                      │
                      ▼
   Certified Versioned Training Dataset (.parquet / .csv)
   Dataset: GSI_ISRO_NLFC_v2.1  (6,000 Samples)
   SHA-256 Checksum: b043958f9a4e49485679e0f7b88422ceae299956a2a9d5c559bcbda55a0cdf0a
                      │
                      ▼
     backend/app/pipeline/train_versioned_model.py
     HistGradientBoosting Ensemble + CalibratedClassifierCV
     Metrics: ROC-AUC: 0.9276 | PR-AUC: 0.8851 | F1: 0.8428 | Brier: 0.1064
                      │
                      ▼
   Immutable Serialized Model Checkpoint (.joblib + .json Lineage)
   Model: LRIDS_GSI_ISRO_v2.1.joblib
   Lineage: LRIDS_GSI_ISRO_v2.1_lineage.json
                      │
══════════════════════╪═════════════════════════════════════════════════════════
                      │  [STRICT READ-ONLY CONSUMPTION - ZERO RUNTIME TRAINING]
                      ▼
             ONLINE OPERATIONAL BACKEND
             ──────────────────────────
           FastAPI App (app/api/v1/ml.py)
                      │
                      ▼
          Vite React Defense-Grade C2 UI
```

### Why Decoupling is Mission-Critical
1. **Zero Data Snooping / Leakage**: Real-time telemetry must never be used to train weights without rigorous multi-fold temporal isolation.
2. **Deterministic Certification**: In emergency disaster operations, response commanders must know the exact model version and cryptographic SHA-256 hash validating hazard outputs.
3. **Auditability**: Regulators and geological engineers can audit the offline training manifest without disrupting 24/7 command center uptime.
