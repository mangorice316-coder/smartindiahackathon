# AI Coding Agent Context & Engineering Rules

## Mission
Modify and extend this repository safely while preserving geotechnical validity, architectural decoupling, security boundaries, and automated test coverage.

## Project Intent
- **System**: LRIDS (AI-Powered Landslide Risk Intelligence & Early Warning System)
- **Domain**: Geotechnical limit equilibrium ($F_s$), hydro-meteorological forecasting, and C2 disaster management.
- **Key Mandate**: The ML model must **NEVER** be trained on live dashboard numbers. All model changes must execute through the independent offline pipeline (`backend/app/pipeline/`).

## Source-of-Truth Hierarchy
1. **Automated test suites** (`backend/tests/`): Tests define ground-truth contracts.
2. **Current implementation code** (`backend/app/`, `frontend/src/`).
3. **Pydantic schemas & database entities** (`backend/app/models/`).
4. **Official governance catalogs** (`DATA_SOURCE_CATALOG.md`, `docs/`).
5. **README & documentation**.

## Absolute Prohibitions
- **Never fabricate data**: Do not create imaginary telemetry numbers or invent fake test cases.
- **Never train on live dashboard metrics**: Maintain strict decoupling between offline training and online inference.
- **Never disable tests**: Fix the underlying root cause; never remove test assertions.
- **Never expose credentials**: Avoid committing private API keys or hardcoded production JWT secrets.
- **Preserve ODbL 1.0 license attribution**: All OpenStreetMap data must display mandatory attribution.\n