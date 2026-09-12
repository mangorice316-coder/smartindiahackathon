# LRIDS Documentation Index

Comprehensive technical documentation for the **AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)**.

## Core Architectural & Technical Documents

| Document | Description |
|---|---|
| [System Architecture](ARCHITECTURE.md) | End-to-end C2 system architecture, multi-tier data pipeline, and tech stack |
| [Algorithms & Mechanics](ALGORITHMS.md) | Geotechnical limit-equilibrium ($F_s$), $API_{72}$, ML ensembles, and Saabas XAI |
| [Innovation & Differentiators](INNOVATION.md) | Novelty matrix, hackathon differentiators, and comparison against legacy systems |
| [Data Model & Entities](DATA_MODEL.md) | Relational database schema, Pydantic models, and GeoJSON feature specifications |
| [API Reference](API.md) | Complete OpenAPI/REST endpoint documentation with parameters and cURL examples |
| [Performance & Benchmarks](PERFORMANCE.md) | Latency SLA benchmarks, throughput metrics, and Vite frontend bundle profiling |
| [Security Policy](SECURITY.md) | RBAC model, JWT authentication, rate limiting, and immutable audit ledger |
| [Deployment Guide](DEPLOYMENT.md) | Local development setup, environment variables, production deployment, Docker |
| [Troubleshooting](TROUBLESHOOTING.md) | Operational playbooks for network failover, database locks, and tile rendering |
| [AI Agent Context](AI_AGENT_CONTEXT.md) | Mission protocols, change rules, and source-of-truth priority for AI coding agents |

## Data Governance & Catalog Documents

| Document | Description |
|---|---|
| [Data Source Catalog](../DATA_SOURCE_CATALOG.md) | Authoritative 5-Tier Data Hierarchy (GSI, ISRO, IMD, Copernicus, OSM ODbL 1.0) |
| [Data Quality Standard](DATA_QUALITY_STANDARD.md) | Validation rules, missingness thresholds, and quality assurance gates |
| [Data Dictionary](DATA_DICTIONARY.md) | Complete feature dictionary with engineering units, ranges, and descriptions |
| [Data Lineage](DATA_LINEAGE.md) | Cryptographic provenance from raw telemetry to serialized model checkpoints |
| [Model Data Specification](MODEL_DATA_SPECIFICATION.md) | Training/validation split methodology and feature balance requirements |
| [Reproducibility Guide](REPRODUCIBILITY.md) | Step-by-step reproduction of versioned datasets and model training |\n