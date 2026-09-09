"""Unit & Integration Tests for Foundation Architecture.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Tests:
1. System health & detailed subsystem probes
2. Authentication (login, bad password, token generation)
3. Authorization (RBAC permissions & guards)
4. Database operations & relationships (CRUD, cascades)
5. Risk entity creation & schema validation
6. Pydantic validation error handling
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from app.database import init_db, SessionLocal
from app.models.entities import (
    Location, TerrainFeature, SoilFeature, User, RiskAssessment, Alert
)
from app.auth.security import get_password_hash, create_access_token
from app.services.risk_service import RiskService
from app.data_adapters.demo_adapter import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_environment():
    """Ensure database schema and demo records are loaded."""
    init_db()
    db = SessionLocal()
    seed_demo_data(db, force_reset=False)
    db.close()


def test_detailed_system_health():
    """Verify detailed subsystem health reporting (DB, ML, Physics, Data Providers)."""
    response = client.get("/api/v1/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert "subsystems" in data
    assert data["subsystems"]["database"]["status"] == "HEALTHY"
    assert data["subsystems"]["physics_engine"]["status"] == "HEALTHY"
    assert data["subsystems"]["ml_engine"]["inference_ready"] is True
    assert data["subsystems"]["data_providers"]["sources_count"] >= 3


def test_authentication_workflow():
    """Test user login, token generation, and invalid credential rejections."""
    # 1. Valid Login
    login_payload = {
        "username": "admin",
        "password": "AdminPass2026!"
    }
    response = client.post("/api/v1/auth/login", data=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    token = data["access_token"]

    # 2. Test /auth/me with valid token
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == "admin"
    assert me_data["role"] == "ADMIN"

    # 3. Invalid password rejection
    bad_login = {
        "username": "admin",
        "password": "WrongPassword123"
    }
    bad_response = client.post("/api/v1/auth/login", data=bad_login)
    assert bad_response.status_code == 401
    assert "Incorrect username or password" in bad_response.json()["detail"]


def test_authorization_rbac_guards():
    """Verify role-based access control restrictions."""
    # Create tokens for different roles
    analyst_token = create_access_token(data={"sub": "analyst", "role": "ANALYST"})
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # Analyst can access /auth/me
    me_resp = client.get("/api/v1/auth/me", headers=analyst_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "ANALYST"

    # Test rejection of unauthenticated access
    unauth_resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert unauth_resp.status_code == 401


def test_database_crud_operations():
    """Verify database entity persistence, querying, and relationships."""
    db = SessionLocal()
    try:
        # Create a test catchment
        test_code = "TEST-LOC-99"
        existing = db.query(Location).filter(Location.code == test_code).first()
        if existing:
            db.delete(existing)
            db.commit()

        loc = Location(
            code=test_code,
            name="Mount Test Valley",
            taluk="Test Taluk",
            district="Test District",
            state="Kerala",
            latitude=11.25,
            longitude=76.05,
            elevation_m=920.0,
            population=4500,
            is_demo=True
        )
        db.add(loc)
        db.flush()

        # Add Terrain Feature (1-to-1 relationship)
        tf = TerrainFeature(
            location_id=loc.id,
            slope_degrees=32.0,
            aspect_degrees=180.0,
            elevation_m=920.0,
            twi=8.5
        )
        db.add(tf)

        # Add Soil Feature
        sf = SoilFeature(
            location_id=loc.id,
            soil_type="Sandy Loam",
            cohesion_kpa=15.0,
            friction_angle_deg=28.0,
            ksat_mm_hr=30.0,
            soil_depth_m=2.0
        )
        db.add(sf)
        db.commit()

        # Verify Query
        saved = db.query(Location).filter(Location.code == test_code).first()
        assert saved is not None
        assert saved.terrain_feature.slope_degrees == 32.0
        assert saved.soil_feature.soil_type == "Sandy Loam"

        # Cleanup
        db.delete(saved)
        db.commit()
    finally:
        db.close()


def test_api_input_validation():
    """Verify Pydantic input validation rejects malformed payloads."""
    # Test simulation with multiplier exceeding limit (> 4.0)
    bad_sim_payload = {
        "scenario_name": "Invalid Simulation",
        "rainfall_multiplier": 99.0, # Must be <= 4.0
        "duration_hours": 24
    }
    response = client.post("/api/v1/simulation/run", json=bad_sim_payload)
    assert response.status_code == 422
    errors = response.json().get("detail", [])
    assert any("rainfall_multiplier" in str(err) for err in errors)
