# Landslide Risk Intelligence & Decision Support System (LRIDS)

> **Smart India Hackathon (SIH) — Disaster Management & Geospatial Intelligence Track**  
> *Production-Grade Geospatial AI & Early Warning Decision Support Platform*  
> Verified: **15 Test Suites | 122 Automated Tests Passed (100%) | Zero Build Errors**

---

## 📌 Executive Summary

The **Landslide Risk Intelligence System (LRIDS)** is an operational, physics-coupled geospatial AI platform engineered to support disaster management authorities, Emergency Operation Centers (EOCs), District Magistrates, and field inspection squads. 

Unlike conventional statistical dashboards that render static map overlays, LRIDS executes a continuous **operational decision-support loop** answering five essential disaster management questions:
1. **What is happening?** $\to$ Real-time district situation awareness and active warning tallies.
2. **Where is the hazard?** $\to$ High-resolution sub-catchment spatial risk mapping with GIS contouring.
3. **Why is it happening?** $\to$ Transparent geotechnical slope physics coupled with Saabas feature contribution attribution.
4. **What infrastructure is affected?** $\to$ Automated spatial buffer intersections against critical lifelines (hospitals, schools, bridges, evacuation corridors).
5. **What should authorities do next?** $\to$ Mathematical multi-factor field inspection prioritization and OASIS CAP v1.2 early warning broadcast.

---

## 📊 Core Data Architecture: 4-Tier Data Distinction

In mission-critical disaster management, conflating hypothetical simulations or algorithmic estimates with empirical ground truth can cause operational failure. LRIDS enforces strict, architectural separation across **four distinct data tiers**:

`
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 4-TIER DATA DISTINCTION IN LRIDS                                 │
├───────┬──────────────────────┬───────────────────────────────┬───────────────────────────────────┤
│ TIER  │ DATA CATEGORY        │ SOURCE / ORIGIN               │ OPERATIONAL INTEGRITY GUARANTEE   │
├───────┼──────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 01    │ Real Data            │ Live Meteorological APIs      │ Cryptographic timestamping;       │
│       │                      │ (Open-Meteo, IMD AWS grids,   │ 3-tier fallback degradation;      │
│       │                      │ GSI historical inventory)     │ Strict provenance audit trail.    │
├───────┼──────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 02    │ Demo Data            │ Calibrated Synthetic Dataset  │ Distinct UI demo badge banner;    │
│       │                      │ (Wayanad 2024 Western Ghats   │ is_demo=True relational flag;   │
│       │                      │ physiographic benchmark)      │ ORM immutability event listeners. │
├───────┼──────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 03    │ Model Estimates      │ Probabilistic ML Inference    │ Calibrated probabilities (0-100); │
│       │                      │ (12-Feature HistGradientBoost │ Mohr-Coulomb Factor of Safety;    │
│       │                      │ + Infinite-Slope Stability)   │ Saabas tree-path XAI breakdown.   │
├───────┼──────────────────────┼───────────────────────────────┼───────────────────────────────────┤
│ 04    │ Simulated Scenarios  │ What-If Deluge Simulator      │ Zero-mutation memory buffers;     │
│       │                      │ (+25%, +50%, +100% Monsoon    │ Cloned state; isolated diff layer;│
│       │                      │ cloudburst projections)       │ Baseline DB records protected.    │
└───────┴──────────────────────┴───────────────────────────────┴───────────────────────────────────┘
`

1. **Real Data**: Empirical observations ingested via external adapters (pp/data_adapters/). In production mode, queries IMD AWS stations and Open-Meteo reanalysis grids. Data is validated with range checks, geofenced bounding, and schema normalization.
2. **Demo Data**: Synthetic, physically calibrated baseline data reflecting the July 2024 Wayanad disaster zone (Chooralmala, Mundakkai, Meppadi). Stored with immutable flags; cannot overwrite operational baseline tables.
3. **Model Estimates**: Dynamic statistical predictions generated on-the-fly by the trained ML model (HistGradientBoostingClassifier, ROC-AUC 0.934) coupled to analytical geotechnical equations ($).
4. **Simulated Scenarios**: Hypothetical weather events generated in the **What-If Simulator**. Simulations execute against an ephemeral in-memory clone of catchment states, returning delta comparisons without touching baseline database rows.

---

## 🏆 SIH Judge Demonstration (3–5 Minute Evaluation Flow)

A dedicated **SIH Judge Demonstration Mode** is built directly into the application header. It exercises live working backend APIs, executes active ML inference, evaluates alert thresholds, and dispatches real inspection tasks.

`
┌─────────────────────────────────────────────────────────────────────────┐
│                      THE 9-STEP JUDGE DEMO FLOW                         │
├───────┬───────────────────────────────┬─────────────────────────────────┤
│ STEP  │ VIEW / CAPABILITY             │ WHAT IS PROVEN                  │
├───────┼───────────────────────────────┼─────────────────────────────────┤
│ 01    │ EOC Situational Dashboard     │ 5-Question disaster command KPIs│
│ 02    │ Interactive GIS Risk Map      │ Spatial hotspots, live ticker   │
│ 03    │ Explainable AI (XAI) & Physics│ Saabas feature impact + Fs < 1.0│
│ 04    │ Rainfall Simulator (+50%)     │ Live ML re-run in memory buffer │
│ 05    │ Infrastructure Exposure       │ Buffer intersections (Tier 1-4) │
│ 06    │ Early Warning Dispatch        │ OASIS CAP v1.2 JSON/XML payload │
│ 07    │ Field Inspection Matrix       │ Mathematical priority formula   │
│ 08    │ Executive SitRep Generator    │ Instant commander SitRep export │
│ 09    │ Model Card & Governance       │ ROC-AUC 0.934, SHA-256 integrity│
└───────┴───────────────────────────────┴─────────────────────────────────┘
`

### Demonstration Highlights:
* **"Rain 🌧️ Escalation Loop"**: Switch between Baseline $\to$ **+25%** $\to$ **+50%** $\to$ **+100% Deluge**. Observe how newly saturated sub-catchments escalate from MODERATE to CRITICAL, triggering automatic lifeline alerts and prioritizing field engineering squads.
* **Autoplay Tour**: Click **"▶ Play Tour"** in the demo modal to automatically step through all 9 verification stages with synchronized map pans and metric updates.

---

## 🏛️ Master System Architecture

`
                                  [DATA SOURCES]
        Open-Meteo API │ IMD Gridded Rainfall │ ISRO Bhuvan SRTM DEM │ SoilGrids
                                        │
                                        ▼
                               [03 DATA ENGINE]
                    Ingestion Adapter & Missing-Data Imputer
                   Quality Checks & 3-Tier Fallback Resilience
                                        │
                                        ▼
                               [04 ML RISK ENGINE]
        ┌───────────────────────────────────────────────────────────────┐
        │  Tabular Ensembles (HistGradientBoosting / Random Forest)     │
        │  Geotechnical Physics Engine (Infinite-Slope Factor of Safety)│
        │  Tree-Path Explainability (Saabas Marginal Contributions)     │
        └───────────────────────────────┬───────────────────────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        [05 GIS COMMAND]       [06 ALERTS ENGINE]     [07 SIMULATOR]
        GeoJSON Contours       OASIS CAP v1.2 XML     Isolated In-Memory
        Lifeline Buffering     NDMA / SDMA Format     Zero Baseline Mod
                 │                      │                      │
                 └──────────────────────┼──────────────────────┘
                                        ▼
                            [06 FIELD INSPECTIONS]
                    Multi-Factor Inspection Priority Matrix:
              P = 0.35(Hazard) + 0.25(Pop) + 0.25(Lifeline) + 0.15(Uncert)
                                        │
                                        ▼
                        [08-10 SITREP & REPORTING]
                     Commander Briefings & SitRep Export
`

---

## ⚡ Quickstart & Local Installation

### Prerequisites
* **Python**: 3.10 to 3.14
* **Node.js**: 18+ and npm
* **Git**

### 1. Environment Configuration
Copy the template environment configuration:
`ash
# Backend environment configuration
cp backend/.env.example backend/.env
# Or on Windows PowerShell:
Copy-Item backend/.env.example backend/.env
`

Key environment variables:
| Variable | Default | Purpose |
|---|---|---|
| ENV | development | Runtime environment (development, production, 	est) |
| DATA_MODE | DEMO | DEMO (synthetic benchmark) or REAL (live external APIs) |
| SECRET_KEY | *(dev key)* | JWT signing secret (set random 64-char string in production) |
| DATABASE_URL | sqlite:///./landslide_risk.db | Persistence URI (SQLite zero-config, PostgreSQL supported) |
| RATE_LIMIT_ENABLED| 	rue | Sliding-window DDoS and alert spam prevention |
| STRICT_AUTH | alse | Enforce JWT token verification on all protected endpoints |

### 2. Backend Setup
`ash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed baseline demo data
python seed.py

# Start FastAPI backend server (port 8000)
uvicorn main:app --reload --port 8000
`
* Backend API Docs: http://localhost:8000/docs
* Health Check: http://localhost:8000/health
* Detailed Health & Telemetry: http://localhost:8000/api/v1/health/detailed

### 3. Frontend Setup
`ash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
`
* Web Application: http://localhost:5173

---

## 🔒 Security, Reliability & Red-Team Defense

The platform has been hardened against red-team scrutiny and disaster-critical threats:
* **Role-Based Access Control (RBAC)**: Enforces 4 distinct operational roles (ADMIN, ANALYST, FIELD_OFFICER, READ_ONLY) with signed cryptographic JWT tokens.
* **ORM Immutability Event Listeners**: Enforces strict append-only constraints on AuditEvent and HistoricalLandslide tables.
* **Model Integrity Checks**: SHA-256 checksum validation ensures .joblib model artifacts cannot be silently swapped or tampered with.
* **Simulation Memory Isolation**: What-if cloudburst simulations run in memory buffers and never overwrite empirical baseline rainfall or soil moisture observations.
* **Sliding-Window Rate Limiting**: In-memory sliding window limiter guards against denial-of-service and alert-spamming attacks.
* **Input Sanitization**: Rejects out-of-bounds geographic coordinates, negative spatial buffers, and impossible physical parameter values.

---

## 🧪 Comprehensive Verification Suite

The repository includes **15 dedicated test suites** with **122 automated tests** verifying physics, ML metrics, database integrity, and red-team attacks:

`ash
# Run all 122 backend tests
cd backend
python -m pytest tests/ -v

# Run the dedicated Red-Team QA & Disaster Resilience suite
python -m pytest tests/test_red_team_qa.py -v
python -m pytest tests/test_red_team_deep_qa.py -v

# Run security & RBAC hardening tests
python -m pytest tests/test_security_hardening.py -v

# Verify frontend TypeScript build
cd ../frontend
npm run build
`

---

## 📂 Repository Structure

`
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST route handlers (Auth, GIS, ML, Alerts, etc.)
│   │   ├── auth/            # JWT authentication & RBAC authorization
│   │   ├── core/            # Spatial utilities & domain exceptions
│   │   ├── data_adapters/   # Open-Meteo, IMD, and Demo seeders
│   │   ├── ml/              # Feature pipelines, preprocessing, explainability
│   │   ├── models/          # Relational entities & Pydantic schemas
│   │   ├── physics/         # Geotechnical slope stability (infinite slope)
│   │   ├── security/        # Immutability listeners, rate limiting, logging
│   │   └── simulation/      # Isolated what-if scenario simulator
│   ├── tests/               # 15 pytest test suites (122 automated tests)
│   ├── main.py              # FastAPI application entrypoint
│   ├── seed.py              # Baseline database seeder
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (GIS map, shell, demo controller)
│   │   ├── views/           # Operational Views (Overview, Map, Simulator, etc.)
│   │   ├── services/        # API client and mock data fallbacks
│   │   └── types.ts         # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── ARCHITECTURE.md          # Complete 16-stage pipeline architecture
├── DATA_SOURCES.md          # Indian geotechnical and meteorological data strategy
├── ML_MODEL.md              # Machine learning cards, metrics, and calibration
├── API.md                   # REST API contract and OASIS CAP v1.2 specification
├── DEMO_GUIDE.md            # Interactive 9-step judge demonstration script
├── TESTING.md               # Quality assurance and 15-suite test matrix
├── LIMITATIONS.md           # Scientific assumptions and operational boundaries
└── README.md                # System documentation and operational overview
`

---

## ⚠️ Scientific Limitations & Statutory Advisory

> [!IMPORTANT]
> **DECISION SUPPORT SYSTEM — NOT A DETERMINISTIC PREDICTION GUARANTEE**  
> The Landslide Risk Intelligence System (LRIDS) is an advanced **risk-assessment and decision-support tool**, engineered to assist emergency managers, geotechnical engineers, and civil defense incident commanders.  
> 
> * **Probabilistic Nature**: Landslide occurrence is a non-linear, stochastic geotechnical phenomenon governed by unobservable subsurface hydrogeology, fissure networks, and root-cohesion variations. Risk scores, Factor of Safety ($) estimates, and simulated deluge projections are probabilistic calculations, not deterministic guarantees of the exact timing, volume, or runout path of a slope failure.
> * **Statutory Authority**: Evacuation orders and civil defense mobilizations must originate from statutory authorities (e.g. District Disaster Management Authority, National Disaster Management Authority, or State Revenue Department).
> * **Sensor Dependence**: Reliability is bounded by the spatial resolution of meteorological feeds and digital elevation models. Physical field inspections and ground instrumentation (inclinometers, piezometers) remain mandatory.
