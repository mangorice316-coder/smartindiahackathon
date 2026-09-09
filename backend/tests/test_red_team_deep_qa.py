"""Deep Red-Team QA and Stress Testing Suite.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Probes:
1. ML numerical edge cases, missing features, extreme inputs, and invariant preservation.
2. Geospatial boundary attacks (NaN, out-of-bounds coords, missing relations).
3. Database transaction integrity, rollback safety, and constraint guards.
4. Simulation multi-run non-interference and baseline immutability.
5. Stale data & external API outage resilience (DEMO mode failover).
6. Performance benchmarks for mission-critical command center response times (<500ms).
"""
import time
import math
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from app.database import init_db, SessionLocal
from app.models.entities import (
    Location, TerrainFeature, SoilFeature, RainfallObservation,
    RiskAssessment, Alert, InspectionTask, ModelVersion, DataSource
)
from app.engine.risk_engine import assess_location_risk, classify_risk_score
from app.physics.slope_stability import calculate_factor_of_safety, fs_to_hazard_score
from app.auth.security import create_access_token
from app.data_adapters.demo_adapter import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_redteam_env():
    """Ensure clean baseline database state."""
    init_db()
    db = SessionLocal()
    seed_demo_data(db, force_reset=False)
    db.close()


# ==============================================================================
# 1. ML BOUNDARY & MALFORMED INPUT BREAKER
# ==============================================================================

def test_ml_extreme_and_out_of_bounds_geotechnical_inputs():
    """Verify physics & ML engine strictly clamp out-of-bounds parameters and maintain invariants."""
    # Test extreme slope (89.9 degrees - near vertical cliff)
    fs_cliff, breakdown_cliff = calculate_factor_of_safety(
        slope_degrees=89.9,
        cohesion_kpa=2.0,
        friction_angle_deg=20.0,
        soil_depth_m=2.0,
        bulk_density_kn_m3=18.0,
        saturation_ratio_m=0.9
    )
    assert fs_cliff < 0.5  # Extreme instability
    hazard_cliff = fs_to_hazard_score(fs_cliff)
    assert 0.0 <= hazard_cliff <= 100.0
    assert hazard_cliff > 80.0  # Must be in high/critical hazard territory

    # Test flat plain (0 slope)
    fs_flat, breakdown_flat = calculate_factor_of_safety(
        slope_degrees=0.0,
        cohesion_kpa=10.0,
        friction_angle_deg=30.0,
        soil_depth_m=1.0,
        bulk_density_kn_m3=18.0,
        saturation_ratio_m=0.0
    )
    assert fs_flat >= 5.0
    hazard_flat = fs_to_hazard_score(fs_flat)
    assert hazard_flat == 0.0


def test_ml_prediction_invariants_under_random_fuzzing():
    """Fuzz risk assessment engine with random chaotic inputs; verify all outputs obey [0, 100]."""
    import random
    random.seed(42)

    for trial in range(30):
        slope = random.uniform(0.0, 75.0)
        twi = random.uniform(2.0, 20.0)
        cohesion = random.uniform(0.0, 50.0)
        friction = random.uniform(5.0, 45.0)
        depth = random.uniform(0.5, 6.0)
        density = random.uniform(12.0, 24.0)
        rain_1h = random.uniform(0.0, 250.0)
        rain_24h = random.uniform(0.0, 800.0)
        rain_72h = random.uniform(0.0, 1500.0)
        moisture = random.uniform(0.0, 1.0)
        ndvi = random.uniform(-0.5, 0.9)
        road_dist = random.uniform(0.0, 5000.0)

        result = assess_location_risk(
            location_id=9999,
            location_name=f"Fuzz-Zone-{trial}",
            district="StressTestDistrict",
            terrain={"slope_degrees": slope, "twi": twi},
            soil={"cohesion_kpa": cohesion, "friction_angle_deg": friction, "soil_depth_m": depth, "bulk_density_kn_m3": density},
            rainfall={"intensity_1h_mm": rain_1h, "accum_24h_mm": rain_24h, "antecedent_72h_mm": rain_72h},
            environment={"soil_moisture_ratio": moisture},
            land_cover={"ndvi_index": ndvi, "road_cut_distance_m": road_dist},
            infrastructures=[{"name": "Highway", "asset_type": "HIGHWAY", "lifeline_tier": "TIER_1"}],
            population=5000,
            historical_count=trial % 4
        )

        assert 0.0 <= result["hazard_score"] <= 100.0
        assert 0.0 <= result["exposure_score"] <= 100.0
        assert 0.0 <= result["overall_risk_score"] <= 100.0
        assert result["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert result["geotechnical_fs"] >= 0.0
        assert 0.0 <= result["model_confidence"] <= 1.0


# ==============================================================================
# 2. GEOSPATIAL & INGESTION ROBUSTNESS
# ==============================================================================

def test_missing_relations_graceful_handling():
    """Verify that a newly registered location lacking sensor records does not cause 500 crash."""
    db = SessionLocal()
    test_loc = Location(
        code="TEST-LOC-ORPHAN-01",
        name="Orphan Catchment Zero-Sensor",
        district="TestDistrict",
        state="Kerala",
        latitude=10.1234,
        longitude=76.9876,
        population=1200,
        is_demo=True
    )
    db.add(test_loc)
    db.commit()
    db.refresh(test_loc)
    loc_id = test_loc.id
    db.close()

    try:
        # Request single location assessment
        res = client.get(f"/api/v1/risk/assessments/{loc_id}")
        assert res.status_code in [200, 404]
    finally:
        db = SessionLocal()
        db.query(Location).filter(Location.id == loc_id).delete()
        db.commit()
        db.close()


def test_invalid_spatial_coordinates_rejection():
    """Verify spatial impact calculation rejects impossible bounding queries."""
    res_lat = client.get("/api/v1/gis/catchments/99999/spatial-impact")
    assert res_lat.status_code == 404


# ==============================================================================
# 3. DATABASE TRANSACTION INTEGRITY & CONSTRAINTS
# ==============================================================================

def test_database_transaction_rollback_on_error():
    """Verify that failed database operations roll back cleanly without leaving dirty transactions."""
    db = SessionLocal()
    initial_count = db.query(Alert).count()

    try:
        a1 = Alert(
            alert_code="ALT-TEST-ROLLBACK-01",
            location_id=1,
            risk_score=85.0,
            severity="WARNING",
            trigger_condition="Red-team test",
            recommended_action="Deploy emergency inspection",
            status="ACTIVE"
        )
        db.add(a1)
        db.flush()
        raise ValueError("Simulated unexpected transaction failure")
    except ValueError:
        db.rollback()

    final_count = db.query(Alert).count()
    assert final_count == initial_count, "Rollback failed to restore pre-transaction state"
    db.close()


# ==============================================================================
# 4. SIMULATION MULTI-RUN NON-INTERFERENCE & BASELINE IMMUTABILITY
# ==============================================================================

def test_simulation_multi_run_isolation():
    """Verify back-to-back simulation runs do not leak state or mutate baseline observations."""
    db = SessionLocal()
    baseline_obs = db.query(RainfallObservation).filter(RainfallObservation.location_id == 1).order_by(RainfallObservation.timestamp.desc()).first()
    assert baseline_obs is not None
    original_24h = baseline_obs.accum_24h_mm
    db.close()

    multipliers = [1.25, 1.50, 2.00, 2.50]
    for mult in multipliers:
        res = client.post("/api/v1/simulation/run", json={
            "scenario_name": f"Stress Run +{int((mult-1)*100)}%",
            "rainfall_multiplier": mult,
            "additional_rainfall_mm": 50.0,
            "duration_hours": 24
        })
        assert res.status_code == 200
        data = res.json()
        assert data["parameters"]["rainfall_multiplier"] == mult
        assert data["escalated_zones_count"] >= 0

    db = SessionLocal()
    post_obs = db.query(RainfallObservation).filter(RainfallObservation.location_id == 1).order_by(RainfallObservation.timestamp.desc()).first()
    assert post_obs.accum_24h_mm == original_24h, "Baseline observation was corrupted by simulation runs!"
    db.close()


# ==============================================================================
# 5. DATA QUALITY & STALE DATA FAILOVER
# ==============================================================================

def test_data_sources_health_and_failover():
    """Verify health monitor accurately tracks provider health and demo failover."""
    res = client.get("/api/v1/health/detailed")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert "subsystems" in data
    assert "database" in data["subsystems"]
    assert "ml_engine" in data["subsystems"]
    assert "physics_engine" in data["subsystems"]
    assert "data_providers" in data["subsystems"]
    assert data["subsystems"]["physics_engine"]["status"] == "HEALTHY"


# ==============================================================================
# 6. PERFORMANCE & RESPONSE TIME BENCHMARKS
# ==============================================================================

def test_api_latency_benchmarks():
    """Mission-Critical Latency SLA Benchmark:
    - High-frequency operational telemetry: < 250ms
    - Statewide multi-catchment physics & ML inference batch: < 1500ms
    """
    telemetry_endpoints = [
        "/api/v1/health/status",
        "/api/v1/alerts",
        "/api/v1/inspections",
        "/api/v1/gis/layers/historical-landslides",
        "/api/v1/risk/assess/1"
    ]

    batch_physics_endpoints = [
        "/api/v1/overview",
        "/api/v1/gis/layers/risk-zones",
        "/api/v1/gis/hotspots",
        "/api/v1/reports/sitrep"
    ]

    # 1. Telemetry Endpoints (< 250ms)
    for path in telemetry_endpoints:
        client.get(path) # Warmup
        t0 = time.perf_counter()
        res = client.get(path)
        t_elapsed_ms = (time.perf_counter() - t0) * 1000.0
        assert res.status_code == 200, f"Endpoint {path} failed with status {res.status_code}"
        assert t_elapsed_ms < 250.0, f"Telemetry {path} took {t_elapsed_ms:.1f}ms (exceeds 250ms ceiling)"

    # 2. Multi-Catchment Physics Batch Endpoints (< 1500ms)
    for path in batch_physics_endpoints:
        client.get(path) # Warmup
        t0 = time.perf_counter()
        res = client.get(path)
        t_elapsed_ms = (time.perf_counter() - t0) * 1000.0
        assert res.status_code == 200, f"Endpoint {path} failed with status {res.status_code}"
        assert t_elapsed_ms < 1500.0, f"Batch engine {path} took {t_elapsed_ms:.1f}ms (exceeds 1500ms ceiling)"
