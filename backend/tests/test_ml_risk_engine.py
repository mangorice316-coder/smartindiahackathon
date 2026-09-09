"""Comprehensive Test Suite for the Machine Learning Landslide Risk Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Tests:
- Feature transformation & ordering consistency
- Prediction schema and bounds validation
- Risk-score normalization (0-100)
- Risk classification with configurable thresholds
- Missing-feature handling (rejection vs imputation)
- Model loading, serialization, and versioning
- Tree-path explainability (Saabas decomposition)
- API endpoints & structured error validation
- End-to-end pipeline test
"""
import os
import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from main import app
from app.ml.features import (
    FEATURE_SPECIFICATIONS,
    CORE_FEATURE_NAMES,
    REQUIRED_FEATURES,
    NUMERIC_FEATURES
)
from app.ml.preprocessing import LandslideFeaturePreprocessor
from app.ml.synthetic_dataset import generate_synthetic_landslide_dataset
from app.ml.pipeline import LandslideMLPipeline, classify_risk_score_configurable
from app.ml.model_registry import (
    get_active_pipeline,
    set_active_pipeline,
    get_cached_prediction,
    cache_prediction
)
from app.ml.dataset_loader import load_landslide_dataset

client = TestClient(app)


@pytest.fixture(scope="module")
def trained_pipeline():
    """Module-level trained pipeline fixture for fast test execution."""
    X, y = generate_synthetic_landslide_dataset(n_samples=500, random_seed=42)
    pipeline = LandslideMLPipeline(algorithm="RandomForest")
    pipeline.train_and_evaluate(
        X=X,
        y=y,
        version_tag="TEST_SUITE_RF_v1",
        is_demo=True,
        dataset_type="DEMO DATASET"
    )
    return pipeline


def test_feature_transformation_and_ordering():
    """Verify preprocessor produces correct column alignment and engineered features."""
    X, y = generate_synthetic_landslide_dataset(n_samples=100, random_seed=42)
    preprocessor = LandslideFeaturePreprocessor()
    X_clean, quality = preprocessor.fit_transform(X)

    assert preprocessor.is_fitted
    assert len(X_clean) == 100
    assert "aspect_sin" in X_clean.columns
    assert "aspect_cos" in X_clean.columns
    assert "rainfall_surge_ratio" in X_clean.columns
    assert "antecedent_rain_ratio" in X_clean.columns
    assert "slope_twi_interaction" in X_clean.columns
    assert "shear_stress_proxy" in X_clean.columns

    # Verify column ordering consistency on a second transform
    X2, _ = preprocessor.transform(X.iloc[:10])
    assert list(X2.columns) == list(X_clean.columns)


def test_missing_feature_handling_and_clipping():
    """Verify that optional missing features are imputed and out-of-bounds clipped."""
    X, y = generate_synthetic_landslide_dataset(n_samples=100, random_seed=42)
    preprocessor = LandslideFeaturePreprocessor()
    preprocessor.fit(X)

    # Incomplete test row with extreme slope and missing optional features
    incomplete_row = pd.DataFrame([{
        "rainfall_1h": 10.0,
        "rainfall_24h": 80.0,
        "rainfall_3d": 150.0,
        "soil_moisture": 0.6,
        "elevation": 1200.0,
        "slope": 120.0,  # Physical extreme > 90 deg
        # Omitting optional features like twi, soil_cohesion_kpa, aspect
    }])

    transformed, quality = preprocessor.transform(incomplete_row)
    assert len(transformed) == 1
    # Slope must be clipped to max 90.0
    assert transformed["slope"].values[0] == 90.0
    # Missing optional features must be imputed with non-null values
    assert not pd.isna(transformed["twi"].values[0])
    assert quality[0]["status"] in ["DEGRADED", "IMPUTED_FIELDS"]
    assert "twi" in quality[0]["imputed_fields"]


def test_prediction_schema_validation():
    """Verify that critical required features are enforced."""
    preprocessor = LandslideFeaturePreprocessor()

    # Empty payload
    is_valid, missing = preprocessor.validate_single_input({})
    assert not is_valid
    assert len(missing) >= len(REQUIRED_FEATURES)

    # Valid payload
    valid_payload = {
        "rainfall_1h": 15.0,
        "rainfall_24h": 70.0,
        "rainfall_3d": 160.0,
        "soil_moisture": 0.55,
        "elevation": 1100.0,
        "slope": 32.0
    }
    is_valid, missing = preprocessor.validate_single_input(valid_payload)
    assert is_valid
    assert len(missing) == 0


def test_model_training_and_evaluation():
    """Verify ensemble training and mathematical metrics (ROC-AUC, PR-AUC, Confusion Matrix, Brier)."""
    X, y = generate_synthetic_landslide_dataset(n_samples=400, random_seed=42)
    pipeline = LandslideMLPipeline(algorithm="RandomForest")
    result = pipeline.train_and_evaluate(X, y, version_tag="TEST_EVAL_v1")

    assert pipeline.is_trained
    metrics = result["metrics"]
    assert metrics["accuracy"] >= 0.70
    assert metrics["roc_auc"] >= 0.75
    assert metrics["pr_auc"] >= 0.40
    assert 0.0 <= metrics["brier_score"] <= 0.35

    cm = metrics["confusion_matrix"]
    assert "true_positives" in cm
    assert "false_positives" in cm
    assert "true_negatives" in cm
    assert "false_negatives" in cm
    assert (cm["true_positives"] + cm["false_positives"] + cm["true_negatives"] + cm["false_negatives"]) == metrics["test_sample_count"]

    assert len(metrics["calibration_curve"]) > 0


def test_risk_score_normalization(trained_pipeline):
    """Verify predicted risk score is strictly normalized to [0, 100]."""
    test_sample = {
        "rainfall_1h": 40.0,
        "rainfall_24h": 220.0,
        "rainfall_3d": 450.0,
        "soil_moisture": 0.92,
        "elevation": 1400.0,
        "slope": 42.0,
        "soil_cohesion_kpa": 8.0,
        "land_cover": "barren_rock"
    }
    res = trained_pipeline.predict_risk(test_sample)

    assert 0.0 <= res["risk_score"] <= 100.0
    assert 0.0 <= res["risk_probability"] <= 1.0
    assert res["risk_score"] == round(res["risk_probability"] * 100.0, 1)
    assert res["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert 0.0 <= res["confidence"] <= 1.0


def test_risk_classification_configurable():
    """Verify classification categories and custom threshold overrides."""
    # Standard thresholds: Low <= 25, Moderate <= 50, High <= 75, Critical > 75
    assert classify_risk_score_configurable(15.0) == "LOW"
    assert classify_risk_score_configurable(35.0) == "MODERATE"
    assert classify_risk_score_configurable(65.0) == "HIGH"
    assert classify_risk_score_configurable(85.0) == "CRITICAL"

    # Custom threshold overrides
    assert classify_risk_score_configurable(45.0, threshold_low=50.0) == "LOW"
    assert classify_risk_score_configurable(60.0, threshold_mod=70.0) == "MODERATE"


def test_tree_path_explainability(trained_pipeline):
    """Verify model-supported local tree attribution has non-zero contributions and correct direction."""
    test_sample = {
        "rainfall_1h": 55.0,
        "rainfall_24h": 280.0,
        "rainfall_3d": 520.0,
        "soil_moisture": 0.95,
        "elevation": 1600.0,
        "slope": 48.0,
        "soil_cohesion_kpa": 6.0
    }
    res = trained_pipeline.predict_risk(test_sample)
    exp = res["explanation"]

    assert "base_probability" in exp
    assert "top_risk_drivers" in exp
    assert len(exp["top_risk_drivers"]) > 0

    driver = exp["top_risk_drivers"][0]
    assert "factor_name" in driver
    assert "display_name" in driver
    assert "observed_value" in driver
    assert driver["direction"] == "INCREASES_RISK"
    assert driver["relative_influence_pct"] >= 0.0


def test_model_serialization_and_loading(tmp_path):
    """Verify pipeline serialization, disk persistence, and reproducible deserialization."""
    X, y = generate_synthetic_landslide_dataset(n_samples=300, random_seed=42)
    pipeline = LandslideMLPipeline(algorithm="RandomForest")
    pipeline.train_and_evaluate(X, y, version_tag="SERIALIZATION_TEST_v1")

    sample_dict = {
        "rainfall_1h": 20.0,
        "rainfall_24h": 100.0,
        "rainfall_3d": 200.0,
        "soil_moisture": 0.7,
        "elevation": 1000.0,
        "slope": 30.0
    }
    pred_orig = pipeline.predict_risk(sample_dict)

    file_path = os.path.join(tmp_path, "pipeline_test.joblib")
    pipeline.save_model(file_path)
    assert os.path.exists(file_path)

    new_pipeline = LandslideMLPipeline()
    new_pipeline.load_model(file_path)
    pred_loaded = new_pipeline.predict_risk(sample_dict)

    assert pred_orig["risk_score"] == pred_loaded["risk_score"]
    assert pred_orig["risk_category"] == pred_loaded["risk_category"]
    assert pred_orig["model_version"] == pred_loaded["model_version"]


def test_batch_prediction_vectorization(trained_pipeline):
    """Verify high-throughput batch prediction returns matching individual predictions."""
    records = [
        {
            "cell_id": f"cell_{i}",
            "rainfall_1h": 5.0 + i * 5,
            "rainfall_24h": 30.0 + i * 20,
            "rainfall_3d": 60.0 + i * 40,
            "soil_moisture": 0.3 + i * 0.1,
            "elevation": 800.0 + i * 100,
            "slope": 15.0 + i * 5
        }
        for i in range(5)
    ]

    batch_res = trained_pipeline.predict_batch(records)
    assert len(batch_res) == 5

    for i, item in enumerate(batch_res):
        assert item["cell_id"] == f"cell_{i}"
        assert 0.0 <= item["risk_score"] <= 100.0
        # Compare with single predict
        single_res = trained_pipeline.predict_risk(records[i])
        assert abs(item["risk_score"] - single_res["risk_score"]) < 1e-4


def test_feature_hash_caching():
    """Verify in-memory feature hash caching prevents redundant computation."""
    sample = {
        "rainfall_1h": 12.0,
        "rainfall_24h": 65.0,
        "rainfall_3d": 140.0,
        "soil_moisture": 0.5,
        "elevation": 900.0,
        "slope": 26.0
    }
    mock_res = {"risk_score": 42.5, "risk_category": "MODERATE"}
    cache_prediction(sample, mock_res)

    retrieved = get_cached_prediction(sample)
    assert retrieved is not None
    assert retrieved["risk_score"] == 42.5


def test_gradient_boosting_algorithm():
    """Verify GradientBoosting algorithm training and inference."""
    X, y = generate_synthetic_landslide_dataset(n_samples=300, random_seed=42)
    pipeline = LandslideMLPipeline(algorithm="GradientBoosting")
    eval_res = pipeline.train_and_evaluate(
        X, y,
        version_tag="TEST_GB_v1",
        hyperparameters={"n_estimators": 40, "learning_rate": 0.1, "max_depth": 3}
    )

    assert pipeline.is_trained
    assert eval_res["algorithm"] == "GradientBoosting"
    assert eval_res["metrics"]["accuracy"] > 0.65

    sample = {
        "rainfall_1h": 25.0,
        "rainfall_24h": 120.0,
        "rainfall_3d": 250.0,
        "soil_moisture": 0.8,
        "elevation": 1100.0,
        "slope": 35.0
    }
    pred = pipeline.predict_risk(sample)
    assert 0.0 <= pred["risk_score"] <= 100.0


def test_ml_api_feature_schema():
    """Test GET /api/v1/ml/feature-schema endpoint."""
    resp = client.get("/api/v1/ml/feature-schema")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_features"] == len(CORE_FEATURE_NAMES)
    assert "rainfall_1h" in data["required_features"]
    assert "slope" in data["required_features"]


def test_ml_api_predict_and_validation():
    """Test POST /api/v1/ml/predict with valid and invalid requests."""
    # 1. Reject invalid input missing required features
    resp_invalid = client.post("/api/v1/ml/predict", json={"features": {"aspect": 180.0}})
    assert resp_invalid.status_code == 422
    err = resp_invalid.json()["detail"]
    assert "missing_required_features" in err

    # 2. Valid input
    valid_payload = {
        "features": {
            "rainfall_1h": 25.0,
            "rainfall_24h": 110.0,
            "rainfall_3d": 240.0,
            "soil_moisture": 0.75,
            "elevation": 1050.0,
            "slope": 34.0,
            "soil_cohesion_kpa": 16.0,
            "land_cover": "tea_estate"
        }
    }
    resp_valid = client.post("/api/v1/ml/predict", json=valid_payload)
    assert resp_valid.status_code == 200
    data = resp_valid.json()
    assert "risk_score" in data
    assert "risk_probability" in data
    assert "risk_category" in data
    assert "explanation" in data
    assert data["is_demo"] is True
    assert "NOT FOR REAL-WORLD DECISION MAKING" in data["disclaimer"]


def test_ml_api_batch_predict():
    """Test POST /api/v1/ml/batch-predict endpoint."""
    payload = {
        "items": [
            {
                "cell_id": "grid_01",
                "latitude": 11.685,
                "longitude": 76.132,
                "features": {
                    "rainfall_1h": 30.0,
                    "rainfall_24h": 140.0,
                    "rainfall_3d": 300.0,
                    "soil_moisture": 0.85,
                    "elevation": 1200.0,
                    "slope": 38.0
                }
            },
            {
                "cell_id": "grid_02",
                "latitude": 11.690,
                "longitude": 76.138,
                "features": {
                    "rainfall_1h": 5.0,
                    "rainfall_24h": 25.0,
                    "rainfall_3d": 60.0,
                    "soil_moisture": 0.35,
                    "elevation": 850.0,
                    "slope": 14.0
                }
            }
        ]
    }
    resp = client.post("/api/v1/ml/batch-predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_processed"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["cell_id"] == "grid_01"


def test_end_to_end_ml_risk_engine():
    """End-to-End Test: Input Features -> Preprocessor -> Model -> Risk Score -> Category -> Tree Explanation."""
    # 1. Load calibrated dataset
    dataset = load_landslide_dataset(fallback_demo_samples=400, random_seed=99)
    assert dataset.is_demo is True
    assert "NOT FOR REAL-WORLD" in dataset.source_description

    # 2. Train pipeline
    pipeline = LandslideMLPipeline(algorithm="RandomForest")
    pipeline.train_and_evaluate(dataset.X, dataset.y, version_tag="E2E_VERIFIED_v1")

    # 3. Simulate high-risk monsoon cloudburst scenario
    cloudburst_features = {
        "rainfall_1h": 65.0,
        "rainfall_3h": 140.0,
        "rainfall_6h": 220.0,
        "rainfall_12h": 310.0,
        "rainfall_24h": 420.0,
        "rainfall_3d": 680.0,
        "rainfall_7d": 920.0,
        "soil_moisture": 0.96,
        "elevation": 1450.0,
        "slope": 44.0,
        "aspect": 210.0,
        "soil_cohesion_kpa": 9.0,
        "soil_friction_angle_deg": 24.0,
        "soil_depth_m": 2.8,
        "land_cover": "tea_estate",
        "ndvi": 0.45,
        "twi": 11.2,
        "weathering_grade": "highly_weathered",
        "historical_landslide_density": 4.0,
        "distance_to_previous_landslide": 120.0
    }

    # 4. Predict Risk
    output = pipeline.predict_risk(cloudburst_features)

    # 5. Verify outputs
    assert output["risk_probability"] > 0.60
    assert output["risk_score"] > 60.0
    assert output["risk_category"] in ["HIGH", "CRITICAL"]
    assert output["model_version"] == "E2E_VERIFIED_v1"
    assert output["is_demo"] is True

    # 6. Verify explanation
    exp = output["explanation"]
    assert len(exp["top_risk_drivers"]) > 0
    top_driver_names = [d["factor_name"] for d in exp["top_risk_drivers"]]
    # Rainfall or slope should be among top drivers for cloudburst
    assert any(k in top_driver_names for k in ["rainfall_24h", "rainfall_3d", "rainfall_1h", "slope", "soil_moisture"])
