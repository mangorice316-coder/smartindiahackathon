"""Tests for 5-Tier Data Hierarchy and Decoupled Offline ML Pipeline.

Project: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS).
Verifies:
1. GSI NLFC 8 susceptibility factors and 5 data hierarchy tiers in hierarchy.py.
2. Dataset builder produces verified SHA-256 checksums and valid manifest.
3. Offline model training serializes artifact with embedded provenance.
4. /api/v1/ml/pipeline/lineage REST endpoint returns compliant data hierarchy and ODbL attribution.
"""

import os
import json
import pytest
from fastapi.testclient import TestClient
from main import app

from app.pipeline.hierarchy import (
    DataHierarchyTier,
    GSI_8_SUSCEPTIBILITY_FACTORS,
    TIER_SPECIFICATIONS,
    ODbLAttribution,
    get_data_hierarchy_specification
)
from app.pipeline.dataset_builder import DATASETS_DIR, compute_file_sha256
from app.pipeline.train_versioned_model import MODELS_DIR

client = TestClient(app)


def test_data_hierarchy_specification():
    """Verify 5-Tier Data Hierarchy contract and GSI 8 factors."""
    spec = get_data_hierarchy_specification()
    assert spec["framework_version"] == "5-TIER-GSI-ISRO-v2.1"
    assert len(spec["tiers"]) == 5

    tier_names = [t["tier"] for t in spec["tiers"]]
    assert DataHierarchyTier.TIER_1_GSI_NLFC in tier_names
    assert DataHierarchyTier.TIER_2_ISRO_NRSC in tier_names
    assert DataHierarchyTier.TIER_3_IMD_WEATHER in tier_names
    assert DataHierarchyTier.TIER_4_COPERNICUS_SAR in tier_names
    assert DataHierarchyTier.TIER_5_OSM_INFRASTRUCTURE in tier_names

    # Check GSI 8 factors
    assert len(spec["gsi_8_factors"]) == 8
    factor_ids = [f["id"] for f in spec["gsi_8_factors"]]
    expected_factors = ["slope", "aspect", "slope_shape", "lithology", "structure", "geomorphology", "land_use_cover", "geohydrology"]
    for ef in expected_factors:
        assert ef in factor_ids, f"Expected GSI factor {ef} missing from hierarchy specification"

    # Verify ODbL Attribution
    assert "odbl" in spec["licensing"]
    assert "OpenStreetMap" in spec["licensing"]["odbl"]["copyright_statement"]
    assert "ODbL 1.0" in spec["licensing"]["attribution_banner"]


def test_dataset_artifact_and_manifest_integrity():
    """Verify versioned dataset artifact exists and matches its manifest SHA-256 hash."""
    manifest_path = os.path.join(DATASETS_DIR, "GSI_ISRO_NLFC_v2.1_manifest.json")
    assert os.path.exists(manifest_path), "GSI_ISRO_NLFC_v2.1_manifest.json not found"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest["dataset_name"] == "GSI_ISRO_NLFC_v2.1"
    assert manifest["row_count"] >= 1000
    assert 0.20 <= manifest["positive_ratio"] <= 0.80

    csv_path = os.path.join(DATASETS_DIR, "GSI_ISRO_NLFC_v2.1.csv")
    assert os.path.exists(csv_path), "GSI_ISRO_NLFC_v2.1.csv not found"
    actual_hash = compute_file_sha256(csv_path)
    assert actual_hash == manifest["sha256_csv"], "Cryptographic SHA-256 mismatch on dataset artifact"


def test_model_artifact_and_lineage():
    """Verify offline trained model artifact exists and contains valid metrics and lineage."""
    model_path = os.path.join(MODELS_DIR, "LRIDS_GSI_ISRO_v2.1.joblib")
    lineage_path = os.path.join(MODELS_DIR, "LRIDS_GSI_ISRO_v2.1_lineage.json")

    assert os.path.exists(model_path), "LRIDS_GSI_ISRO_v2.1.joblib model artifact not found"
    assert os.path.exists(lineage_path), "LRIDS_GSI_ISRO_v2.1_lineage.json not found"

    with open(lineage_path, "r", encoding="utf-8") as f:
        lineage = json.load(f)

    assert lineage["model_version_tag"] == "LRIDS_GSI_ISRO_v2.1"
    assert lineage["metrics"]["roc_auc"] >= 0.85
    assert lineage["metrics"]["pr_auc"] >= 0.75
    assert lineage["metrics"]["brier_score"] <= 0.25
    assert lineage["decoupled_architecture"]["is_decoupled"] is True
    assert lineage["decoupled_architecture"]["live_dashboard_dependency"] is False


def test_api_pipeline_lineage_endpoint():
    """Verify /api/v1/ml/pipeline/lineage endpoint contract and ODbL licensing."""
    response = client.get("/api/v1/ml/pipeline/lineage")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] in ["ACTIVE_VERSIONED_PIPELINE", "DEFAULT_HIERARCHY_READY"]
    spec = data.get("hierarchy_specification") or data.get("lineage", {}).get("hierarchy_spec")
    assert spec is not None
    assert len(spec["tiers"]) == 5
    assert "OpenStreetMap" in spec["licensing"]["attribution_banner"]
