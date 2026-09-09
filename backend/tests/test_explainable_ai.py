"""Unit and Integration Tests for Explainable AI (XAI) Subsystem.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Verifies:
1. Explanation consistency: feature changes only affect corresponding explanations.
2. Ground-truth attribution: top drivers and protective factors reflect actual model weights.
3. Missing data transparency: imputed fields are explicitly labeled, never hidden.
4. Defined confidence methodology: tiers (HIGH, MEDIUM, LOW) computed rigorously.
5. Community view sanitization: plain language, no sensitive system leaks.
6. REST API endpoints (/xai/location/{id}, /xai/explain, /xai/transparency).
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db
from app.data_adapters.demo_adapter import seed_demo_data
from app.ml.model_registry import initialize_or_load_default_model, get_active_pipeline
from app.xai.explainer_service import LandslideXAIExplainer


@pytest.fixture(scope="module")
def xai_test_client():
    """Create isolated in-memory test database and client."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSession()
    seed_demo_data(db, force_reset=True)
    initialize_or_load_default_model(db)
    db.close()

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_explanation_consistency_and_rainfall_sensitivity(xai_test_client):
    """Verifies that increasing rainfall increases its local risk attribution."""
    base_features = {
        "rainfall_1h": 5.0,
        "rainfall_24h": 30.0,
        "rainfall_3d": 60.0,
        "slope": 30.0,
        "soil_moisture": 0.35,
        "elevation": 1200.0,
        "soil_cohesion": 15.0,
        "friction_angle": 28.0,
        "soil_depth": 2.0,
        "bulk_density": 18.5,
        "geological_formation": "Gneissic Complex",
        "land_cover": "Mixed Forest",
        "ndvi": 0.60
    }

    surged_features = dict(base_features)
    surged_features["rainfall_24h"] = 160.0
    surged_features["rainfall_1h"] = 45.0
    surged_features["rainfall_3d"] = 280.0

    exp_base = LandslideXAIExplainer.explain_feature_vector(base_features)
    exp_surged = LandslideXAIExplainer.explain_feature_vector(surged_features)

    # Surged features must have higher risk score
    assert exp_surged.analyst_view.risk_score >= exp_base.analyst_view.risk_score

    # Find rainfall_24h in both explanations
    rf_base = next((f for f in exp_base.analyst_view.all_features if f.feature_name == "rainfall_24h"), None)
    rf_surged = next((f for f in exp_surged.analyst_view.all_features if f.feature_name == "rainfall_24h"), None)

    assert rf_base is not None
    assert rf_surged is not None
    # Delta probability of rainfall_24h must be significantly higher in surged case
    assert rf_surged.delta_probability >= rf_base.delta_probability
    assert rf_surged.direction == "INCREASES_RISK"

    # Narrative must mention rainfall in surged explanation
    assert "rainfall" in exp_surged.analyst_view.physical_narrative.lower()


def test_protective_factor_detection():
    """Verifies that flat terrain and high vegetation are identified as protective factors."""
    protective_features = {
        "rainfall_1h": 2.0,
        "rainfall_24h": 15.0,
        "rainfall_3d": 30.0,
        "slope": 8.0,  # Very gentle slope
        "soil_moisture": 0.20,
        "elevation": 400.0,
        "soil_cohesion": 25.0,  # Strong cohesion
        "friction_angle": 35.0,
        "soil_depth": 1.0,
        "bulk_density": 19.0,
        "geological_formation": "Gneissic Complex",
        "land_cover": "Dense Evergreen Forest",
        "ndvi": 0.82  # Dense healthy vegetation
    }

    exp = LandslideXAIExplainer.explain_feature_vector(protective_features)

    # Risk category should be LOW
    assert exp.analyst_view.risk_category in ["LOW", "MODERATE"]

    # Protective factors must contain at least one factor with negative delta
    protective = exp.analyst_view.top_protective_factors
    assert len(protective) > 0
    for p in protective:
        assert p.delta_probability <= 0.0
        assert p.direction == "DECREASES_RISK"


def test_missing_data_transparency_and_imputation():
    """Verifies that missing features are explicitly flagged as IMPUTED/ESTIMATED."""
    sparse_features = {
        "rainfall_1h": 10.0,
        "rainfall_24h": 40.0,
        "slope": 25.0,
        # Missing soil_cohesion, bulk_density, soil_moisture, etc.
    }

    exp = LandslideXAIExplainer.explain_feature_vector(sparse_features)

    # Missing fields should be in imputed_fields
    imputed = exp.analyst_view.imputed_fields
    assert len(imputed) > 0

    # For imputed features, quality status must be IMPUTED/ESTIMATED
    for f in exp.analyst_view.all_features:
        if f.feature_name in imputed:
            assert f.quality_status == "IMPUTED/ESTIMATED"

    # Confidence must reflect penalty for missing data
    assert exp.confidence.imputed_features_count > 0


def test_confidence_tier_methodology():
    """Verifies that confidence tier reflects defined data quality and tree agreement math."""
    # 1. Complete feature set
    complete_features = {
        "rainfall_1h": 10.0,
        "rainfall_3h": 25.0,
        "rainfall_6h": 40.0,
        "rainfall_12h": 60.0,
        "rainfall_24h": 80.0,
        "rainfall_3d": 120.0,
        "rainfall_7d": 180.0,
        "soil_moisture": 0.45,
        "elevation": 1200.0,
        "slope": 28.0,
        "aspect": 150.0,
        "topographic_wetness_index": 8.0,
        "soil_cohesion": 18.0,
        "friction_angle": 30.0,
        "soil_depth": 2.0,
        "bulk_density": 18.5,
        "geological_formation": "Gneissic Complex",
        "land_cover": "Mixed Forest",
        "ndvi": 0.55
    }

    exp_complete = LandslideXAIExplainer.explain_feature_vector(complete_features)
    assert exp_complete.confidence.tier in ["HIGH", "MEDIUM"]
    assert exp_complete.confidence.confidence_score >= 0.50
    assert "CONFIDENCE" in exp_complete.confidence.methodology_rationale

    # 2. Heavily missing feature set
    minimal_features = {"rainfall_1h": 5.0, "rainfall_24h": 20.0, "slope": 20.0}
    exp_sparse = LandslideXAIExplainer.explain_feature_vector(minimal_features)
    # Sparse confidence score should be lower than complete
    assert exp_sparse.confidence.confidence_score <= exp_complete.confidence.confidence_score


def test_community_view_sanitization():
    """Verifies that the community citizen view is plain-language and omits sensitive internals."""
    features = {
        "rainfall_1h": 35.0,
        "rainfall_24h": 140.0,
        "rainfall_3d": 220.0,
        "slope": 36.0,
        "soil_moisture": 0.70,
        "elevation": 1400.0,
        "soil_cohesion": 10.0,
        "friction_angle": 24.0,
        "soil_depth": 2.5,
        "bulk_density": 18.0,
        "geological_formation": "Gneissic Complex",
        "land_cover": "Tea Plantation",
        "ndvi": 0.40
    }

    exp = LandslideXAIExplainer.explain_feature_vector(
        features,
        location_name="Meppadi Settlement",
        district="Wayanad"
    )

    comm = exp.community_view
    assert "Meppadi" in comm.plain_language_headline or "Wayanad" in comm.affected_area_summary
    assert len(comm.why_risk_is_elevated) > 0
    assert len(comm.recommended_citizen_actions) > 0
    assert len(comm.active_monitoring_actions) > 0

    # Ensure no raw internal object strings leak into community text
    comm_dump = str(comm.model_dump())
    assert "sklearn" not in comm_dump
    assert "ndarray" not in comm_dump
    assert "RandomForestClassifier" not in comm_dump


def test_location_xai_endpoint(xai_test_client):
    """Test GET /api/v1/xai/location/{location_id} returns valid dual-audience payload."""
    res = xai_test_client.get("/api/v1/xai/location/1")
    assert res.status_code == 200
    data = res.json()

    assert data["location_id"] == 1
    assert "analyst_view" in data
    assert "community_view" in data
    assert "confidence" in data
    assert "disclaimer" in data

    # Verify analyst view components
    analyst = data["analyst_view"]
    assert "risk_score" in analyst
    assert "risk_category" in analyst
    assert "top_risk_drivers" in analyst
    assert "all_features" in analyst
    assert "physical_narrative" in analyst
    assert analyst["geotechnical_fs"] is not None

    # Verify community view components
    comm = data["community_view"]
    assert "plain_language_headline" in comm
    assert "why_risk_is_elevated" in comm
    assert "recommended_citizen_actions" in comm


def test_explain_custom_features_endpoint(xai_test_client):
    """Test POST /api/v1/xai/explain with arbitrary feature vector."""
    payload = {
        "location_name": "Test Catchment Beta",
        "district": "Idukki",
        "features": {
            "rainfall_1h": 20.0,
            "rainfall_24h": 95.0,
            "rainfall_3d": 160.0,
            "slope": 32.0,
            "soil_moisture": 0.55,
            "elevation": 1100.0,
            "soil_cohesion": 12.0,
            "friction_angle": 26.0,
            "soil_depth": 2.0,
            "bulk_density": 18.5,
            "geological_formation": "Gneissic Complex",
            "land_cover": "Mixed Forest",
            "ndvi": 0.50
        }
    }

    res = xai_test_client.post("/api/v1/xai/explain", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["location_name"] == "Test Catchment Beta"
    assert data["analyst_view"]["risk_score"] > 0
    assert len(data["analyst_view"]["top_risk_drivers"]) > 0
    assert len(data["community_view"]["why_risk_is_elevated"]) > 0


def test_model_transparency_endpoint(xai_test_client):
    """Test GET /api/v1/xai/transparency returns metadata, metrics, and limitations."""
    res = xai_test_client.get("/api/v1/xai/transparency")
    assert res.status_code == 200
    data = res.json()

    assert "model_version" in data
    assert "algorithm" in data
    assert "training_dataset_id" in data
    assert "evaluation_metrics" in data
    assert "confusion_matrix" in data
    assert "feature_schema" in data
    assert "physical_assumptions_and_limitations" in data
    assert len(data["physical_assumptions_and_limitations"]) >= 4

    metrics = data["evaluation_metrics"]
    assert "roc_auc" in metrics
    assert "accuracy" in metrics
    assert "brier_score" in metrics
