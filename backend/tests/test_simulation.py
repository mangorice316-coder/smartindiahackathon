"""Comprehensive Unit & Integration Test Suite for Rainfall What-If Simulation Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Verifies:
1. Scenario isolation & strict baseline immutability.
2. Rainfall feature transformation consistency.
3. Active ML pipeline and geotechnical Factor of Safety recalculation.
4. Standard disaster presets (0%, 10%, 25%, 50%, 75%, 100%).
5. LRU scenario caching and hit/miss behavior.
6. Scenario comparison (Scenario A vs Scenario B).
7. GeoJSON difference layer mapping.
8. Simulation SITREP report generation and mandatory disclaimer.
9. FastAPI REST simulation routes.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from main import app
from app.data_adapters.demo_adapter import seed_demo_data
from app.models.entities import Location, RainfallObservation, EnvironmentalObservation
from app.models.schemas import (
    SimulationRequest,
    SimulationComparisonRequest,
    SimulationReportRequest,
    SimulationTimeSeriesRequest
)
from app.simulation.simulator import (
    run_rainfall_simulation,
    compare_rainfall_scenarios,
    generate_simulation_geojson,
    generate_simulation_report,
    project_simulation_timeseries,
    SCIENTIFIC_DISCLAIMER
)
from app.simulation.scenario_cache import scenario_cache


from sqlalchemy.pool import StaticPool


@pytest.fixture
def test_db():
    """Create in-memory SQLite DB with seeded demonstration catchments."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSession()
    seed_demo_data(session, force_reset=True)
    yield session
    session.close()


@pytest.fixture
def client(test_db):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_scenario_isolation_and_baseline_preservation(test_db):
    """Verify that simulating extreme deluge does NOT mutate historical DB records."""
    loc = test_db.query(Location).first()
    assert loc is not None

    ro_before = test_db.query(RainfallObservation).filter(RainfallObservation.location_id == loc.id).all()
    eo_before = test_db.query(EnvironmentalObservation).filter(EnvironmentalObservation.location_id == loc.id).all()

    intensities_before = [r.intensity_1h_mm for r in ro_before]
    accum_before = [r.accum_24h_mm for r in ro_before]
    moisture_before = [e.soil_moisture_ratio for e in eo_before]

    # Execute extreme 300% deluge (+200mm)
    req = SimulationRequest(
        scenario_name="Extreme 100-Year Cloudburst (+300% Deluge)",
        rainfall_multiplier=3.0,
        additional_rainfall_mm=200.0,
        duration_hours=12
    )
    sim_res = run_rainfall_simulation(db=test_db, request=req, use_cache=False)
    assert sim_res.locations_evaluated > 0

    # Verify database state after simulation
    ro_after = test_db.query(RainfallObservation).filter(RainfallObservation.location_id == loc.id).all()
    eo_after = test_db.query(EnvironmentalObservation).filter(EnvironmentalObservation.location_id == loc.id).all()

    intensities_after = [r.intensity_1h_mm for r in ro_after]
    accum_after = [r.accum_24h_mm for r in ro_after]
    moisture_after = [e.soil_moisture_ratio for e in eo_after]

    assert intensities_before == intensities_after, "Historical rainfall observations were modified!"
    assert accum_before == accum_after, "Historical 24h accumulations were modified!"
    assert moisture_before == moisture_after, "Historical soil moisture records were modified!"


def test_rainfall_transformation_consistency(test_db):
    """Verify that only rainfall features change, and terrain/soil features remain identical."""
    loc = test_db.query(Location).first()
    assert loc is not None

    tf = loc.terrain_feature
    sf = loc.soil_feature

    # Record terrain and soil values
    slope_orig = tf.slope_degrees
    twi_orig = tf.twi
    cohesion_orig = sf.cohesion_kpa
    friction_orig = sf.friction_angle_deg

    req = SimulationRequest(
        scenario_name="Transformation Test (+150%)",
        rainfall_multiplier=1.5,
        additional_rainfall_mm=50.0,
        duration_hours=24
    )
    res = run_rainfall_simulation(db=test_db, request=req, use_cache=False)

    # Re-verify terrain and soil on entity
    test_db.refresh(tf)
    test_db.refresh(sf)

    assert tf.slope_degrees == slope_orig
    assert tf.twi == twi_orig
    assert sf.cohesion_kpa == cohesion_orig
    assert sf.friction_angle_deg == friction_orig


def test_active_ml_model_and_physics_invoked(test_db):
    """Verify active ML model version is reported and geotechnical Fs declines under surge."""
    req = SimulationRequest(
        scenario_name="Monsoon Surge (+150%)",
        rainfall_multiplier=1.5,
        additional_rainfall_mm=60.0,
        duration_hours=24
    )
    res = run_rainfall_simulation(db=test_db, request=req, use_cache=False)

    assert res.active_model_version is not None
    assert len(res.active_model_version) > 0
    assert res.disclaimer == SCIENTIFIC_DISCLAIMER

    # For every evaluated location: simulated Fs should decrease (pore-water pressure increase)
    for r in res.results:
        assert r.simulated_fs <= r.baseline_fs
        assert r.simulated_risk_score >= r.baseline_risk_score


def test_standard_scenario_presets_progression(test_db):
    """Verify risk progression across standard presets: 0%, 10%, 25%, 50%, 75%, 100%."""
    presets = [
        (1.0, 0.0, "Baseline (0%)"),
        (1.1, 10.0, "+10% Deluge"),
        (1.25, 25.0, "+25% Deluge"),
        (1.50, 50.0, "+50% Deluge"),
        (1.75, 75.0, "+75% Deluge"),
        (2.00, 100.0, "+100% Extreme Deluge")
    ]

    prev_mean_score = 0.0
    for mult, add_mm, name in presets:
        req = SimulationRequest(
            scenario_name=name,
            rainfall_multiplier=mult,
            additional_rainfall_mm=add_mm,
            duration_hours=24
        )
        res = run_rainfall_simulation(db=test_db, request=req, use_cache=False)
        assert res.locations_evaluated > 0

        mean_score = sum(r.simulated_risk_score for r in res.results) / len(res.results)
        assert mean_score >= prev_mean_score, f"Progression not monotonic for {name}"
        prev_mean_score = mean_score


def test_scenario_caching_performance(test_db):
    """Verify LRU cache hits on repeat scenarios and instant retrieval."""
    scenario_cache.clear()

    req = SimulationRequest(
        scenario_name="Cache Performance Test (+150%)",
        rainfall_multiplier=1.5,
        additional_rainfall_mm=50.0,
        duration_hours=24
    )

    # First run: cache miss
    res1 = run_rainfall_simulation(db=test_db, request=req, use_cache=True)
    assert res1.from_cache is False

    # Second run: cache hit
    res2 = run_rainfall_simulation(db=test_db, request=req, use_cache=True)
    assert res2.from_cache is True
    assert res2.locations_evaluated == res1.locations_evaluated
    assert res2.escalated_zones_count == res1.escalated_zones_count

    stats = scenario_cache.get_stats()
    assert stats["hits"] >= 1
    assert stats["size"] >= 1


def test_scenario_comparison_a_vs_b(test_db):
    """Verify differential impact calculation between Scenario A (+25%) and Scenario B (+75%)."""
    req_a = SimulationRequest(
        scenario_name="Scenario A: Moderate Deluge (+25%)",
        rainfall_multiplier=1.25,
        additional_rainfall_mm=25.0,
        duration_hours=24
    )
    req_b = SimulationRequest(
        scenario_name="Scenario B: Severe Surge (+75%)",
        rainfall_multiplier=1.75,
        additional_rainfall_mm=75.0,
        duration_hours=24
    )

    comp = compare_rainfall_scenarios(db=test_db, request_a=req_a, request_b=req_b)

    assert comp.total_locations_compared > 0
    assert comp.disclaimer == SCIENTIFIC_DISCLAIMER
    assert len(comp.results) > 0

    mean_score_a = sum(item.score_a for item in comp.results) / len(comp.results)
    mean_score_b = sum(item.score_b for item in comp.results) / len(comp.results)
    assert mean_score_b >= mean_score_a

    # Geotechnical Fs must be strictly non-increasing under higher pore pressure
    for item in comp.results:
        assert item.fs_b <= item.fs_a
        assert 0.0 <= item.score_a <= 100.0
        assert 0.0 <= item.score_b <= 100.0


def test_simulation_geojson_difference_layers(test_db):
    """Verify GeoJSON FeatureCollection generation for baseline, scenario, and difference layers."""
    req = SimulationRequest(
        scenario_name="GeoJSON Layer Test (+150%)",
        rainfall_multiplier=1.5,
        additional_rainfall_mm=50.0,
        duration_hours=24
    )

    for layer in ["baseline", "scenario", "difference"]:
        geojson = generate_simulation_geojson(db=test_db, request=req, layer_type=layer)
        assert geojson["type"] == "FeatureCollection"
        assert "features" in geojson
        assert len(geojson["features"]) > 0

        first = geojson["features"][0]
        assert first["geometry"]["type"] == "Point"
        assert len(first["geometry"]["coordinates"]) == 2
        assert "color" in first["properties"]
        assert "score" in first["properties"]
        assert "difference_class" in first["properties"]


def test_simulation_report_generation_and_disclaimer(test_db):
    """Verify generation of formal SITREP assessment report in JSON and Markdown formats."""
    req = SimulationRequest(
        scenario_name="SITREP Export Test (+200%)",
        rainfall_multiplier=2.0,
        additional_rainfall_mm=100.0,
        duration_hours=12
    )

    # 1. JSON report
    rep_json = generate_simulation_report(db=test_db, request=req, report_format="json")
    assert rep_json.report_id.startswith("SIM-REP-")
    assert rep_json.executive_summary["total_locations_evaluated"] > 0
    assert rep_json.disclaimer == SCIENTIFIC_DISCLAIMER
    assert len(rep_json.catchment_details) > 0
    assert len(rep_json.limitations) > 0

    # 2. Markdown report
    rep_md = generate_simulation_report(db=test_db, request=req, report_format="markdown")
    assert rep_md.formatted_content is not None
    assert "# Landslide Risk Scenario Assessment Report" in rep_md.formatted_content
    assert SCIENTIFIC_DISCLAIMER in rep_md.formatted_content


def test_simulation_api_endpoints(client):
    """Verify REST API routes for simulation execution, comparison, GeoJSON, and reports."""
    # 1. POST /api/v1/simulation/run
    run_payload = {
        "scenario_name": "API Run Test (+150%)",
        "rainfall_multiplier": 1.5,
        "additional_rainfall_mm": 50.0,
        "duration_hours": 24
    }
    res = client.post("/api/v1/simulation/run", json=run_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["locations_evaluated"] > 0
    assert "results" in data
    assert "disclaimer" in data

    # 2. POST /api/v1/simulation/compare
    comp_payload = {
        "scenario_a": run_payload,
        "scenario_b": {
            "scenario_name": "API Compare B (+200%)",
            "rainfall_multiplier": 2.0,
            "additional_rainfall_mm": 100.0,
            "duration_hours": 24
        }
    }
    res = client.post("/api/v1/simulation/compare", json=comp_payload)
    assert res.status_code == 200
    comp_data = res.json()
    assert comp_data["total_locations_compared"] > 0

    # 3. POST /api/v1/simulation/geojson
    res = client.post("/api/v1/simulation/geojson?layer_type=difference", json=run_payload)
    assert res.status_code == 200
    geo_data = res.json()
    assert geo_data["type"] == "FeatureCollection"
    assert len(geo_data["features"]) > 0

    # 4. POST /api/v1/simulation/report
    rep_payload = {
        "scenario": run_payload,
        "report_format": "markdown"
    }
    res = client.post("/api/v1/simulation/report", json=rep_payload)
    assert res.status_code == 200
    rep_data = res.json()
    assert "SIM-REP-" in rep_data["report_id"]
    assert rep_data["formatted_content"] is not None

    # 5. POST /api/v1/simulation/timeseries
    loc_id = data["results"][0]["location_id"]
    ts_payload = {
        "location_id": loc_id,
        "rainfall_multiplier": 1.5,
        "additional_rainfall_mm": 50.0,
        "duration_hours": 24
    }
    res = client.post("/api/v1/simulation/timeseries", json=ts_payload)
    assert res.status_code == 200
    ts_data = res.json()
    assert len(ts_data["series"]) == 24
    assert ts_data["location_id"] == loc_id

    # 6. GET /api/v1/simulation/history
    res = client.get("/api/v1/simulation/history")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 7. GET /api/v1/simulation/cache/stats
    res = client.get("/api/v1/simulation/cache/stats")
    assert res.status_code == 200
    assert "hits" in res.json()
