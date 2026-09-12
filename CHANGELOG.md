# Changelog

All notable changes to the **Landslide Risk Intelligence & Early Warning System (LRIDS)** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-09-12

### Added
- **Authoritative 5-Tier Data Hierarchy**:
  - Tier 1: GSI NLFC Ground Truth Labels & 8 Susceptibility Factors (Slope, Aspect, Curvature, Lithology, Structure, Geomorphology, LULC, Geohydrology).
  - Tier 2: ISRO / NRSC Landslide Atlas of India (~80,000 historical events 1998-2022).
  - Tier 3: IMD & Open Government Data dynamic precipitation triggers and antecedent indices ($API_{72}$).
  - Tier 4: Copernicus Data Space Sentinel-1 C-band SAR (all-weather day/night cloud penetration) & Sentinel-2 MSI.
  - Tier 5: OpenStreetMap (OSM) under Open Database License (ODbL 1.0) attribution.
- **Strict Model / Dashboard Decoupling Engine** (`backend/app/pipeline/`):
  - `dataset_builder.py`: Compiles certified versioned training datasets (`GSI_ISRO_NLFC_v2.1`) with SHA-256 checksums (`b043958f9a...`).
  - `train_versioned_model.py`: Independent offline training engine outputting serialized checkpoints (`LRIDS_GSI_ISRO_v2.1.joblib`) with embedded JSON lineage manifests.
  - REST endpoint `GET /api/v1/ml/pipeline/lineage` exposing full data hierarchy and ODbL licensing.
- **Interactive Data Hierarchy & Lineage Modal** (`DataHierarchyModal.tsx`) accessible via header button `Hierarchy & Lineage v2.1`.
- Permanent OpenStreetMap ODbL 1.0 attribution pill on GIS Map Canvas.

## [2.0.0] - 2026-09-12

### Added
- **Defense-Grade C2 Interface Overhaul**:
  - Luxury double-bezel concentric cards with subtle hairline borders (`border-white/[0.07]`).
  - Tactile glass command dock and high-contrast alert status badges.
  - Live Operational Incident Briefing banner (`INCIDENT: WAYANAD MONSOON SURGE`).
  - 1-Click Guided Scenario Demonstration Tour modal (`GuidedScenarioTourModal.tsx`) for hackathon judges.
  - Quick Geospatial & Intelligence tool island (GPS, Satellite, Roads, Crack reporting).
- **Google Stitch AI Studio Bridge** (`StitchStudioModal.tsx`) for next-generation C2 UI prompt generation.

## [1.5.0] - 2026-09-12

### Added
- Scrapling library installation and real-world disaster telemetry harvesting into EOC database.

## [1.0.0] - 2026-09-11

### Added
- Initial Smart India Hackathon operational platform.
- FastAPI REST backend with 15+ endpoints.
- Infinite-slope geotechnical limit-equilibrium engine (Mohr-Coulomb Factor of Safety).
- Tabular Machine Learning pipeline (`HistGradientBoosting` + `RandomForest`) with Saabas tree-path Explainable AI.
- Leaflet GIS Command Canvas with multi-layer GeoJSON overlays.
- 4-Tier Role-Based Access Control (Admin, Analyst, Field Officer, Public).\n