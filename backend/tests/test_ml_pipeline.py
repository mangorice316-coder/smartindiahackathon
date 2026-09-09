"""Unit Tests for Machine Learning Pipeline & Explainability.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
import pytest
from app.ml.synthetic_dataset import generate_synthetic_landslide_dataset, FEATURE_NAMES
from app.ml.pipeline import LandslideMLPipeline


def test_synthetic_dataset_generation():
    """Verify that synthetic dataset matches feature dimensions and has both classes."""
    X, y = generate_synthetic_landslide_dataset(n_samples=300, random_seed=42)
    assert len(X) == 300
    assert len(y) == 300
    assert list(X.columns) == FEATURE_NAMES
    # Check that both classes (0 and 1) exist
    assert 0 in y.values
    assert 1 in y.values


def test_pipeline_training_and_evaluation():
    """Verify ensemble training, cross-validation, and metrics output."""
    X, y = generate_synthetic_landslide_dataset(n_samples=400, random_seed=42)
    pipeline = LandslideMLPipeline(algorithm="RandomForest")
    result = pipeline.train_and_evaluate(X, y, version_tag="TEST_RF_v1")

    assert pipeline.is_trained
    assert result["version_tag"] == "TEST_RF_v1"
    assert "accuracy" in result["metrics"]
    assert result["metrics"]["accuracy"] > 0.70
    assert len(result["feature_importances"]) == len(FEATURE_NAMES)


def test_pipeline_prediction_and_explanation():
    """Verify inference probability bounds and XAI factor attribution."""
    X, y = generate_synthetic_landslide_dataset(n_samples=300, random_seed=42)
    pipeline = LandslideMLPipeline(algorithm="RandomForest")
    pipeline.train_and_evaluate(X, y)

    sample_features = {
        "slope_degrees": 40.0,
        "twi": 11.5,
        "rainfall_intensity_1h": 25.0,
        "rainfall_accum_24h": 190.0,
        "rainfall_antecedent_72h": 400.0,
        "soil_moisture_ratio": 0.90,
        "soil_cohesion_kpa": 12.0,
        "ndvi_vegetation": 0.40,
        "historical_event_density": 5,
        "road_cut_distance_m": 35.0
    }

    prob = pipeline.predict_probability(sample_features)
    assert 0.0 <= prob <= 1.0

    explanations = pipeline.explain_prediction(sample_features)
    assert len(explanations) > 0
    assert len(explanations) <= 5
    for item in explanations:
        assert "factor_name" in item
        assert "contribution_score" in item
        assert item["direction"] in ["INCREASES_RISK", "DECREASES_RISK"]
