# Authoritative Data Source Catalog

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Governance Framework**: National Data Sharing and Accessibility Policy (NDSAP) & ODbL 1.0  
**Specification Reference**: Section 8 & Section 41.1

---

## 1. Multi-Tier Data Hierarchy Overview

LRIDS enforces a strict 5-Tier Data Hierarchy to guarantee that machine-learning models are trained solely on scientifically defensible, field-validated, and authoritative national repositories. Under no circumstances are live dashboard telemetry numbers or uncalibrated mock streams used for ML training.

```
┌────────────────────────────────────────────────────────┐
│ TIER 1: National Geological Ground Truth & Baselines   │
│ - GSI NLFC (National Landslide Forecasting Centre)     │
│ - GSI NLSM (8 Regional Susceptibility Factor Layers)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ TIER 2: Historical Landslide Inventory Records         │
│ - ISRO / NRSC Landslide Atlas of India (80,000+ scars) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ TIER 3: National Meteorological & Dynamic Triggers     │
│ - IMD Automatic Weather Stations (AWS) & 0.25° Gridded │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ TIER 4: Earth Observation & Radar Satellite Telemetry  │
│ - Copernicus Sentinel-1 SAR C-Band (Day/Night All-Wx) │
│ - Copernicus Sentinel-2 MSI Multi-Spectral Optical     │
│ - NASA SRTM / ALOS PALSAR 30m Global DEM               │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ TIER 5: Crowdsourced Lifeline Exposure (ODbL 1.0)       │
│ - OpenStreetMap (OSM) Highways, Buildings & Waterways  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Authoritative Dataset Registrations

| Dataset ID | Tier | Agency / Provider | Dataset Name | Native Spatial Res | Temporal Cadence | Format | Access Protocol / Endpoint | License |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GSI_NLFC_INV` | **Tier 1** | Geological Survey of India | National Landslide Forecasting Centre Inventory | 1:50,000 (~30m) | Event-driven / Daily Monsoonal | GeoJSON / WFS | `https://nlfc.gsi.gov.in/geoserver/wfs` | Government of India NDSAP |
| `GSI_NLSM_8F` | **Tier 1** | Geological Survey of India | NLSM 8 Core Susceptibility Factors | 30m Grid | Static / 5-Year Major Revision | Cloud-Optimized GeoTIFF | `https://bhukosh.gsi.gov.in/` | Government of India NDSAP |
| `ISRO_NRSC_LAI` | **Tier 2** | ISRO / NRSC | Landslide Atlas of India (1998–2022) | 1:25,000–1:50,000 | Historical Baseline (1998–2022) | Shapefile / Feature Service | `https://bhuvan-app1.nrsc.gov.in/` | ISRO Data Policy / Academic |
| `IMD_AWS_GRID` | **Tier 3** | India Meteorological Department | High-Resolution Gridded & AWS Rainfall | 0.25° x 0.25° & Station | 15-min AWS / 24-hr Gridded | NetCDF4 / REST JSON | `https://dsp.imdpune.gov.in/` | IMD Open Data Services |
| `ESA_S1_SAR` | **Tier 4** | Copernicus / ESA | Sentinel-1 SAR C-Band Level-1 GRD / SLC | 10m Ground Resolution | 6–12 Days Repeat Orbit | SAFE / GeoTIFF | `https://dataspace.copernicus.eu/` | Copernicus Open Access |
| `ESA_S2_MSI` | **Tier 4** | Copernicus / ESA | Sentinel-2 MSI Level-2A BOA Reflectance | 10m–20m Bands | 5 Days Constellation Repeat | SAFE / Cloud-Optimized GeoTIFF | `https://dataspace.copernicus.eu/` | Copernicus Open Access |
| `NASA_SRTM_DEM`| **Tier 4** | NASA / USGS | Shuttle Radar Topography Mission 1 Arc-Sec | 30m Spatial Grid | Static Baseline Topography | GeoTIFF (.tif) | `https://earthexplorer.usgs.gov/` | Public Domain |
| `OSM_LIFELINES`| **Tier 5** | OpenStreetMap Contributors | Critical Infrastructure & Highway Corridors | Vector Line/Polygon | Continuous Real-Time Streaming | PBF / Overpass QL | `https://overpass-api.de/api/interpreter` | Open Database License (ODbL 1.0) |

---

## 3. Tier 1: GSI 8 Core Susceptibility Factors

In strict alignment with the Geological Survey of India National Landslide Susceptibility Mapping (NLSM) guidelines, susceptibility modeling requires the following 8 fundamental thematic layers:

1. **Slope Angle**: Expressed in degrees ($0^{\circ} - 90^{\circ}$), driving shear stress along prospective rupture surfaces.
2. **Slope Aspect**: Azimuth orientation ($0^{\circ} - 360^{\circ}$), capturing rain-bearing monsoon wind exposure and solar drying cycles.
3. **Slope Curvature (Slope Shape)**: Planar, concave (convergent hollows concentrating pore pressure), or convex (divergent ridges).
4. **Lithology**: Bedrock formation, lithological competency, and rock weathering grades (Grade 1 fresh crystalline through Grade 5 saprolite/colluvium).
5. **Geological Structure**: Distance to regional thrust faults, lineament intersection density, and bedding/foliation dip-slope planar relationships.
6. **Geomorphology**: Genetic landform units (escarpments, colluvial debris fans, structural valleys, denudational hills).
7. **Land Use / Land Cover (LULC)**: Anthropogenic modification, canopy protection, tea/rubber plantation root mechanics, and road excavations.
8. **Geohydrology**: Topographic Wetness Index ($TWI = \ln(a / \tan \beta)$) and groundwater seep convergence zones.

---

## 4. Tier 5: OpenStreetMap Licensing & Mandatory Attribution

Any derived spatial exposure metrics, road corridor vulnerability tables, or settlement proximity layers incorporating OpenStreetMap data strictly preserve the following attribution notice:

> **Data © OpenStreetMap contributors, licensed under the Open Database License (ODbL) 1.0.**  
> Attribution URL: `https://www.openstreetmap.org/copyright`  
> Any Public Cartographic or Analytical Output derived from OSM features retains compliance with ODbL Section 4.3 (Notice Requirement).

---

## 5. Ingestion Verification & Cryptographic Auditing

All acquired source layers undergo automated SHA-256 digest computation immediately upon landing in `data/raw/`. No layer enters the standardization pipeline (`pipelines/cleaning/`) without a matching cryptographic record registered in `metadata/dataset_catalog.csv`.
