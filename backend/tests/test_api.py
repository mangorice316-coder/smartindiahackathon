"""Integration Tests for FastAPI REST Endpoints.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from app.database import init_db, SessionLocal
from app.data_adapters.demo_adapter import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database schema is created and demo data is loaded."""
    init_db()
    db = SessionLocal()
    seed_demo_data(db, force_reset=False)
    db.close()


def test_root_endpoint():
    """Verify system info banner on root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "AI-Powered Landslide Risk Intelligence" in data["system"]


def test_health_status():
    """Verify system health liveness probe."""
    response = client.get("/api/v1/health/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["database"] == "CONNECTED"


def test_dashboard_overview():
    """Verify overview KPIs."""
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_monitored_zones"] >= 5
    assert "highest_risk_locations" in data
    assert len(data["highest_risk_locations"]) > 0


def test_locations_list():
    """Verify listing monitored catchments."""
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) >= 5
    names = [loc["name"] for loc in locations]
    assert any("Meppadi" in n for n in names)


def test_gis_layers():
    """Verify GeoJSON layers for risk zones, infrastructure, and historical scars."""
    # 1. Risk Zones
    res_zones = client.get("/api/v1/gis/layers/risk-zones")
    assert res_zones.status_code == 200
    zones = res_zones.json()
    assert zones["type"] == "FeatureCollection"
    assert len(zones["features"]) >= 5
    for feat in zones["features"]:
        assert "risk_score" in feat["properties"]
        assert "fill_color" in feat["properties"]

    # 2. Infrastructure
    res_infra = client.get("/api/v1/gis/layers/infrastructure")
    assert res_infra.status_code == 200
    infra = res_infra.json()
    assert infra["type"] == "FeatureCollection"
    assert len(infra["features"]) >= 10

    # 3. Historical Landslides
    res_hist = client.get("/api/v1/gis/layers/historical-landslides")
    assert res_hist.status_code == 200
    hist = res_hist.json()
    assert hist["type"] == "FeatureCollection"
    assert len(hist["features"]) >= 5


def test_simulation_execution():
    """Verify executing what-if simulation via REST API."""
    payload = {
        "scenario_name": "REST API Test Cloudburst",
        "rainfall_multiplier": 1.5,
        "additional_rainfall_mm": 50.0,
        "duration_hours": 24
    }
    response = client.post("/api/v1/simulation/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_name"] == "REST API Test Cloudburst"
    assert len(data["results"]) >= 5


def test_reports_sitrep():
    """Verify situation report generation."""
    response = client.get("/api/v1/reports/sitrep")
    assert response.status_code == 200
    data = response.json()
    assert "executive_summary" in data
    assert "critical_hotspots" in data
    assert "scientific_disclaimer" in data
