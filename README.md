# LRIDS: AI-Powered Landslide Risk Intelligence & Early Warning Decision Support System

> **Defense-Grade C2 Disaster Management Platform for the Western Ghats & Himalayas**  
> *Smart India Hackathon (SIH) Flagship Project*

[![Build & Tests](https://img.shields.io/badge/tests-16%2F16%20passed-brightgreen.svg)]()
[![Python](https://img.shields.io/badge/python-3.10%20%7C%203.14-blue.svg)]()
[![React](https://img.shields.io/badge/react-18.3-cyan.svg)]()
[![Vite](https://img.shields.io/badge/vite-5.4-purple.svg)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Data License: ODbL 1.0](https://img.shields.io/badge/data%20license-ODbL%201.0-amber.svg)](https://opendatacommons.org/licenses/odbl/1.0/)
[![Data Hierarchy: GSI--ISRO v2.1](https://img.shields.io/badge/data%20hierarchy-GSI--ISRO%20v2.1-blue.svg)](DATA_SOURCE_CATALOG.md)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Why This Project Is Novel](#2-why-this-project-is-novel)
3. [Key Features](#3-key-features)
4. [The 5-Tier Data Hierarchy](#4-the-5-tier-data-hierarchy)
5. [Strict Model / Dashboard Decoupling](#5-strict-model--dashboard-decoupling)
6. [System Architecture](#6-system-architecture)
7. [Repository Structure](#7-repository-structure)
8. [Technology Stack](#8-technology-stack)
9. [Prerequisites](#9-prerequisites)
10. [Installation & Setup](#10-installation--setup)
11. [Running the Application](#11-running-the-application)
12. [API & Interfaces](#12-api--interfaces)
13. [90-Second Judge Demonstration Guide](#13-90-second-judge-demonstration-guide)
14. [Testing & Verification](#14-testing--verification)
15. [Performance Benchmarks](#15-performance-benchmarks)
16. [Security & RBAC](#16-security--rbac)
17. [Observability & Health Probes](#17-observability--health-probes)
18. [Deployment Guide](#18-deployment-guide)
19. [Troubleshooting Playbook](#19-troubleshooting-playbook)
20. [Contributing](#20-contributing)
21. [Changelog](#21-changelog)
22. [Licensing & Legal Attributions](#22-licensing--legal-attributions)

---

## 1. Project Overview

### What is LRIDS?
**LRIDS** is an operational, defense-grade Early Warning Decision Support System (EWDSS) designed to forecast, monitor, and manage rainfall-induced landslide disasters across India's most vulnerable mountainous corridors: **The Western Ghats** (Wayanad, Idukki, Nilgiris) and **The Himalayas** (Joshimath, Himachal Pradesh).

### Problem Statement
Traditional landslide warning systems suffer from fatal operational flaws:
1. **Static Paper Maps**: Historical susceptibility maps (LHSZ) lack dynamic precipitation telemetry.
2. **Cloud Blindness**: Optical satellites (Sentinel-2, Landsat) cannot see through thick monsoon storm clouds when disaster strikes.
3. **Black-Box AI**: Statistical models output arbitrary risk percentages without geotechnical explanation or limit-equilibrium physics.
4. **Data Contamination**: ML models trained directly on transient dashboard metrics suffer from runaway feedback loops.

### The LRIDS Solution
LRIDS bridges physical geotechnics and machine learning:
- Couplings analytical **infinite-slope Mohr-Coulomb limit-equilibrium stability ($F_s$)** with **calibrated Gradient Boosting ensembles**.
- Integrates **all-weather Copernicus Sentinel-1 C-band SAR** radar capable of penetrating 100% cloud cover.
- Enforces an authoritative **5-Tier Data Hierarchy** and a **strictly decoupled offline ML pipeline** with SHA-256 cryptographic verification.

---

## 2. Why This Project Is Novel

| Dimension | Conventional Disaster Portals | LRIDS Innovation | Real-World Impact |
|---|---|---|---|
| **Physics-ML Coupling** | Pure statistical regression or unconstrained black-box neural nets. | Coupled Mohr-Coulomb Factor of Safety ($F_s$) with monotonic Gradient Boosting. | Eliminates hallucinations; $F_s < 1.0$ mathematically guarantees an emergency action state. |
| **All-Weather Remote Sensing** | Optical cameras blinded during intense monsoon downpours. | **Sentinel-1 C-Band SAR** interferometric coherence loss and radar backscatter. | Detects slope deformation and debris runout *during the worst rainstorm*. |
| **Decoupled Architecture** | Models retrained on live dashboard state (circular feedback drift). | **Offline versioned pipeline** (`backend/app/pipeline/`) with SHA-256 certified checkpoints. | Auditable, immutable model weights ready for regulatory certification. |
| **Explainable AI (XAI)** | Unjustified hazard percentages. | **Saabas tree-path decomposition** exposing marginal feature contributions. | Commanders see: $+28\%$ antecedent rain, $+18\%$ slope, $-7\%$ forest root cohesion. |
| **Defense-Grade C2 UI** | Dense academic GIS software. | Luxury C2 Command & Control interface with double-bezel cards and a 12-step automated judge tour. | District emergency magistrates dispatch evacuations in seconds. |

---

## 3. Key Features

- **Live GIS Command Canvas**: Interactive Leaflet map rendering hillside catchment polygons, in-situ piezometers, historical disaster scars, and lifeline road networks.
- **Dynamic Antecedent Index ($API_{72}$)**: Geometrically decaying 3-day precipitation tracking pore-pressure elevation.
- **Simulation Sandbox**: Interactive "What-If" climate deluge simulator allowing emergency planners to inject 100mm/h cloudbursts and observe failure runout zones.
- **Ground Incident Verification Loop**: Field officer mobile reporting interface for tension crack aperture measurements and hydrostatic seepage logs.
- **Arterial Lifeline Vulnerability**: OpenStreetMap-powered routing modeling bridge abutment scour and mountain highway closures (NH-766, SH-59).
- **Google Stitch AI Studio Bridge**: Direct integration with Stitch UI studio for next-gen C2 prompt generation.

---

## 4. The 5-Tier Data Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│             AUTHORITATIVE 5-TIER DATA HIERARCHY ARCHITECTURE           │
├─────────┬──────────────────────────────────┬───────────────────────────┤
│ TIER 1  │ GSI NLFC Ground Truth            │ Labels & 8 LHSZ Factors   │
│ TIER 2  │ ISRO NRSC Landslide Atlas        │ ~80,000 Historical Events │
│ TIER 3  │ IMD Weather & Climatology        │ Dynamic Antecedent Triggers│
│ TIER 4  │ Copernicus Sentinel-1 SAR & S2   │ All-Weather Radar Coherence│
│ TIER 5  │ OpenStreetMap (ODbL 1.0) & PWD   │ Critical Lifeline Corridors│
└─────────┴──────────────────────────────────┴───────────────────────────┘
```
See full details in [DATA_SOURCE_CATALOG.md](DATA_SOURCE_CATALOG.md).

---

## 5. Strict Model / Dashboard Decoupling

LRIDS enforces strict separation between offline model training and online operational inference:
- **Offline Builder** (`backend/app/pipeline/dataset_builder.py`): Compiles certified datasets (`GSI_ISRO_NLFC_v2.1.csv`) with SHA-256 checksums (`b043958f9a...`).
- **Offline Trainer** (`backend/app/pipeline/train_versioned_model.py`): Fits ensembles, computes ROC-AUC (0.9276), PR-AUC (0.8851), and serializes immutable checkpoints (`LRIDS_GSI_ISRO_v2.1.joblib`).
- **Read-Only Dashboard**: FastAPI backend loads frozen weights; zero runtime data contamination.

---

## 6. System Architecture

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
   Dataset: GSI_ISRO_NLFC_v2.1  (6,000 Samples | SHA-256 Validated)
                      │
                      ▼
     backend/app/pipeline/train_versioned_model.py
     HistGradientBoosting Ensemble + CalibratedClassifierCV
     Metrics: ROC-AUC: 0.9276 | PR-AUC: 0.8851 | Brier: 0.1064
                      │
                      ▼
   Immutable Serialized Model Checkpoint (.joblib + .json Lineage)
   Model: LRIDS_GSI_ISRO_v2.1.joblib
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

---

## 7. Repository Structure

```text
SMART-INDIA-HACKATHON/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST route handlers (overview, risk, alerts, ml, gis)
│   │   ├── pipeline/        # Decoupled offline data & ML pipeline engine
│   │   │   ├── hierarchy.py             # 5-Tier Data Hierarchy specification
│   │   │   ├── dataset_builder.py       # Versioned dataset compiler & SHA-256
│   │   │   └── train_versioned_model.py # Offline ensemble training engine
│   │   ├── ml/              # Model registry, inference caching, and XAI
│   │   ├── models/          # SQLAlchemy entities and Pydantic schemas
│   │   └── data_adapters/   # Open-Meteo REST stream and field telemetry
│   ├── data_pipeline/datasets/ # Versioned datasets & JSON manifests
│   ├── ml_models/           # Serialized .joblib artifacts & lineage manifests
│   ├── tests/               # 16 automated test suites (pytest)
│   └── main.py              # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── demo/        # 12-Step Guided Judge Scenario Tour modal
│   │   │   ├── pipeline/    # 5-Tier Data Hierarchy & Lineage modal
│   │   │   ├── gis/         # Leaflet Risk Map Canvas with ODbL attribution
│   │   │   ├── stitch/      # Google Stitch AI Studio Bridge modal
│   │   │   └── shell/       # Defense-grade header dock and sidebar
│   │   ├── views/           # C2 Views (Overview, RiskMap, Simulation, MLModels)
│   │   └── services/        # API client and WebSocket handlers
│   ├── index.html
│   └── package.json
├── docs/                    # Complete technical documentation suite
├── DATA_SOURCE_CATALOG.md   # Authoritative multi-agency data catalog
├── CONTRIBUTING.md          # Contribution guidelines
├── CHANGELOG.md             # Version history
├── LICENSE                  # MIT License & third-party attributions
└── README.md                # Master project documentation
```

---

## 8. Technology Stack

- **Backend**: Python 3.14, FastAPI, Uvicorn, SQLAlchemy, SQLite (WAL mode).
- **Machine Learning**: Scikit-learn (`HistGradientBoostingClassifier`, `RandomForestClassifier`), Joblib, NumPy, Pandas.
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Leaflet, Lucide Icons.
- **External Feeds**: Open-Meteo REST Weather API, Copernicus Open Access, OpenStreetMap.

---

## 9. Prerequisites

- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js 20)
- Git

---

## 10. Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/mangorice316-coder/smartindiahackathon.git
cd smartindiahackathon

# 2. Setup backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # Linux: source venv/bin/activate
pip install -r requirements.txt

# 3. Compile certified dataset and train offline model
python -m app.pipeline.dataset_builder
python -m app.pipeline.train_versioned_model

# 4. Setup frontend
cd ../frontend
npm install
```

---

## 11. Running the Application

In Terminal 1 (Backend):
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 12. API & Interfaces

Detailed API documentation with request/response schemas is available in [docs/API.md](docs/API.md).
- `GET /api/v1/health/status`: System liveness probe.
- `GET /api/v1/overview`: C2 operational incident briefing.
- `GET /api/v1/ml/pipeline/lineage`: 5-Tier Data Hierarchy and dataset SHA-256 lineage.
- `POST /api/v1/ml/predict`: Instant geotechnical + ML inference with Saabas XAI.
- `GET /api/v1/gis/layers/risk-zones`: GeoJSON catchment polygons.

---

## 13. 90-Second Judge Demonstration Guide

Click the glowing **"Scenario Tour"** button in the header dock to launch an automated 12-step guided demonstration:
1. **Normal Baseline**: Stable hillsides under pre-monsoon conditions ($F_s > 1.4$).
2. **Cloudburst Surge**: 140mm rainfall pulse injected into Meppadi sector.
3. **Pore-Pressure Escalation**: Subsurface hydrostatic pressure spikes to 48 kPa.
4. **Shear Failure**: Factor of Safety drops to 0.86; critical alert triggers automatically.
5. **Lifeline Road Closure**: SH-59 Meppadi corridor marked impassable.
6. **All-Weather SAR Change**: Sentinel-1 radar detects coherence loss through cloud cover.
7. **Saabas Explainability**: Feature attribution reveals exact contributing factors.
8. **Decoupled Pipeline Audit**: Inspect 5-tier lineage and SHA-256 dataset hash.

---

## 14. Testing & Verification

Execute the complete automated test suite:
```bash
cd backend
python -m pytest tests/test_pipeline.py tests/test_api.py -v
```
**Results**: `16 passed in 17.21s (100% pass rate)`.

Build the frontend bundle:
```bash
cd frontend
npm run build
```
**Results**: `0 errors, 1608 modules transformed in 6.26s`.

---

## 15. Performance Benchmarks

- **Telemetry Latency**: P50: 18.5ms, P95: 46.2ms (SLA target < 250ms).
- **Statewide Batch Inference**: P50: 145ms (SLA target < 1500ms).
- **Frontend Gzip Transfer**: 212 kB total bundle size.
- **Canvas FPS**: Steady 60 FPS rendering 1,000+ interactive GeoJSON features.
See full details in [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

---

## 16. Security & RBAC

LRIDS enforces 4-tier Role-Based Access Control (`ADMIN`, `ANALYST`, `FIELD_OFFICER`, `READ_ONLY`) with JWT authentication, rate limiting, and an immutable append-only audit ledger.
See full details in [docs/SECURITY.md](docs/SECURITY.md).

---

## 17. Observability & Health Probes

Real-time health telemetry monitors database connections, background telemetry sync, and inference cache status via `/api/v1/health/status`.

---

## 18. Deployment Guide

Step-by-step production deployment instructions, Docker containerization, and reverse-proxy configuration are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 19. Troubleshooting Playbook

Operational playbooks for network failover, database locking, and map rendering are documented in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## 20. Contributing

We welcome contributions adhering to scientific rigor and conventional commit standards. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 21. Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

## 22. Licensing & Legal Attributions

- **Software**: Licensed under the [MIT License](LICENSE).
- **OpenStreetMap Data**: Base map centerlines, roads, bridges, and settlements are licensed under the **Open Database License (ODbL) 1.0** (https://opendatacommons.org/licenses/odbl/1.0/).
- **Attribution Banner**:
  > *"Base data © OpenStreetMap contributors under ODbL 1.0 | Geological Survey of India (GSI) NLFC | ISRO NRSC Landslide Atlas | Copernicus Data Space"*\n