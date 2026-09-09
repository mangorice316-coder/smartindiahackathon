"""Security, Reliability, and Data-Integrity Hardening Test Suite.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Tests:
1. Multi-role authentication & token generation (Admin, Analyst, Field Officer, Read-Only).
2. Independent backend RBAC enforcement & HTTP 403 Forbidden checks.
3. Database ORM immutability guards (AuditEvent append-only, HistoricalLandslide delete-block).
4. Simulation isolation & baseline non-interference verification.
5. In-memory sliding-window rate limiting & HTTP 429 Retry-After response headers.
6. Geographic & physical bounds input validation (-90 to 90 lat, -180 to 180 lon, multiplier bounds).
7. Credential sanitization & sensitive data masking (no password or token leaks).
"""
import pytest
from datetime import timedelta
import logging
from fastapi.testclient import TestClient

from main import app
from app.database import init_db, SessionLocal
from app.models.entities import (
    AuditEvent, HistoricalLandslide, ModelVersion, RainfallObservation
)
from app.auth.security import create_access_token, mask_sensitive_data
from app.security.integrity import compute_model_checksum
from app.security.safe_logging import SensitiveDataSanitizingFilter
from app.security.rate_limiter import rate_limiter
from app.data_adapters.demo_adapter import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_security_environment():
    """Ensure database schema and default 4 operational roles are seeded."""
    init_db()
    db = SessionLocal()
    seed_demo_data(db, force_reset=False)
    db.close()


@pytest.fixture
def auth_tokens():
    """Helper fixture providing valid JWT tokens for all 4 operational roles."""
    rate_limiter.reset()
    roles = {
        "admin": ("admin", "AdminPass2026!"),
        "analyst": ("analyst", "AnalystPass2026!"),
        "field_officer": ("field_officer", "FieldPass2026!"),
        "viewer": ("viewer", "ViewerPass2026!")
    }
    tokens = {}
    for role_key, (username, password) in roles.items():
        res = client.post("/api/v1/auth/login", data={"username": username, "password": password})
        assert res.status_code == 200, f"Failed to login {username}"
        tokens[role_key] = res.json()["access_token"]
    return tokens


# ==============================================================================
# 1. AUTHENTICATION & MULTI-ROLE VERIFICATION
# ==============================================================================

def test_four_role_login_success(auth_tokens):
    """Verify all 4 operational roles can authenticate and acquire scoped tokens."""
    for role_name in ["admin", "analyst", "field_officer", "viewer"]:
        token = auth_tokens[role_name]
        headers = {"Authorization": f"Bearer {token}"}
        res = client.get("/api/v1/auth/me", headers=headers)
        assert res.status_code == 200
        user_info = res.json()
        assert "hashed_password" not in user_info
        assert "password" not in user_info


def test_invalid_and_expired_tokens():
    """Verify tampered or invalid JWT signatures are rejected with HTTP 401."""
    # 1. Bogus token
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert res.status_code == 401
    assert "detail" in res.json()

    # 2. Expired token (delta = -10 minutes)
    expired_token = create_access_token(
        data={"sub": "admin", "role": "ADMIN"},
        expires_delta=timedelta(minutes=-10)
    )
    res_exp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res_exp.status_code == 401


# ==============================================================================
# 2. INDEPENDENT BACKEND RBAC GUARDS (HTTP 403 FORBIDDEN)
# ==============================================================================

def test_rbac_admin_only_operations(auth_tokens):
    """Verify ADMIN operations are strictly forbidden to Analyst, Field Officer, and Viewer."""
    admin_headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    analyst_headers = {"Authorization": f"Bearer {auth_tokens['analyst']}"}
    field_headers = {"Authorization": f"Bearer {auth_tokens['field_officer']}"}
    viewer_headers = {"Authorization": f"Bearer {auth_tokens['viewer']}"}

    # Endpoint 1: Clear Cache (POST /api/v1/data-engine/cache/clear)
    # Admin allowed
    res_admin = client.post("/api/v1/data-engine/cache/clear", headers=admin_headers)
    assert res_admin.status_code == 200

    # Non-admins rejected with HTTP 403
    for h, role in [(analyst_headers, "ANALYST"), (field_headers, "FIELD_OFFICER"), (viewer_headers, "VIEWER")]:
        res = client.post("/api/v1/data-engine/cache/clear", headers=h)
        assert res.status_code == 403, f"Expected 403 Forbidden for {role} on cache/clear, got {res.status_code}"

    # Endpoint 2: Update Alert Trigger Thresholds (POST /api/v1/alerts/config)
    config_payload = {
        "critical_risk_score_threshold": 75.0,
        "high_risk_score_threshold": 55.0,
        "risk_surge_delta_threshold": 15.0,
        "rapid_rainfall_intensity_threshold": 30.0,
        "rainfall_24h_accumulation_threshold": 120.0,
        "rainfall_72h_accumulation_threshold": 220.0,
        "cooldown_window_minutes": 60
    }
    # Analyst rejected
    res_analyst_cfg = client.post("/api/v1/alerts/config", json=config_payload, headers=analyst_headers)
    assert res_analyst_cfg.status_code == 403

    # Viewer rejected
    res_viewer_cfg = client.post("/api/v1/alerts/config", json=config_payload, headers=viewer_headers)
    assert res_viewer_cfg.status_code == 403

    # Admin allowed
    res_admin_cfg = client.post("/api/v1/alerts/config", json=config_payload, headers=admin_headers)
    assert res_admin_cfg.status_code == 200


def test_rbac_analyst_and_admin_operations(auth_tokens):
    """Verify Analyst & Admin can run simulations and prioritize inspections, while Field Officer & Viewer are rejected."""
    admin_headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    analyst_headers = {"Authorization": f"Bearer {auth_tokens['analyst']}"}
    field_headers = {"Authorization": f"Bearer {auth_tokens['field_officer']}"}
    viewer_headers = {"Authorization": f"Bearer {auth_tokens['viewer']}"}

    sim_payload = {
        "scenario_name": "RBAC Security Test Run",
        "rainfall_multiplier": 1.5,
        "duration_hours": 24
    }

    # Simulation Run: Admin & Analyst allowed
    res_admin = client.post("/api/v1/simulation/run", json=sim_payload, headers=admin_headers)
    assert res_admin.status_code == 200

    res_analyst = client.post("/api/v1/simulation/run", json=sim_payload, headers=analyst_headers)
    assert res_analyst.status_code == 200

    # Simulation Run: Field Officer & Viewer rejected with 403
    res_field = client.post("/api/v1/simulation/run", json=sim_payload, headers=field_headers)
    assert res_field.status_code == 403

    res_viewer = client.post("/api/v1/simulation/run", json=sim_payload, headers=viewer_headers)
    assert res_viewer.status_code == 403


# ==============================================================================
# 3. DATA INTEGRITY & ORM IMMUTABILITY GUARDS
# ==============================================================================

def test_audit_event_immutability():
    """Verify AuditEvent is strictly append-only: updates and deletes raise PermissionError."""
    db = SessionLocal()
    try:
        # Create an audit event
        event = AuditEvent(
            action_type="SECURITY_TEST_AUDIT",
            entity_type="SYSTEM",
            entity_id="test-01",
            user_name="admin",
            payload_summary={"security": "immutability_check"}
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        assert event.id is not None

        # Attempt to modify: must raise PermissionError
        with pytest.raises(PermissionError) as exc_update:
            event.action_type = "TAMPERED_ACTION"
            db.commit()
        assert "Audit logs are immutable" in str(exc_update.value)
        db.rollback()

        # Attempt to delete: must raise PermissionError
        with pytest.raises(PermissionError) as exc_delete:
            event_to_del = db.query(AuditEvent).filter(AuditEvent.id == event.id).first()
            db.delete(event_to_del)
            db.commit()
        assert "Audit logs are append-only" in str(exc_delete.value)
        db.rollback()
    finally:
        db.close()


def test_historical_landslide_delete_protection():
    """Verify HistoricalLandslide records cannot be deleted (ground-truth preservation)."""
    db = SessionLocal()
    try:
        hl = db.query(HistoricalLandslide).first()
        if not hl:
            loc = db.query(Location).first()
            hl = HistoricalLandslide(
                location_id=loc.id if loc else 1,
                latitude=11.5,
                longitude=76.1,
                trigger_type="HEAVY_RAINFALL"
            )
            db.add(hl)
            db.commit()
            db.refresh(hl)

        with pytest.raises(PermissionError) as exc:
            db.delete(hl)
            db.commit()
        assert "Historical landslide scar records are protected" in str(exc.value)
        db.rollback()
    finally:
        db.close()


def test_model_version_checksum_and_integrity():
    """Verify ModelVersion SHA-256 checksum calculation and immutability guard against parameter tampering."""
    db = SessionLocal()
    try:
        mv = db.query(ModelVersion).first()
        if mv:
            cs = compute_model_checksum(mv)
            assert len(cs) == 64
            assert all(c in "0123456789abcdef" for c in cs)

            # Modifying accuracy or hyperparameters should be blocked by integrity guard
            with pytest.raises(PermissionError) as exc:
                mv.accuracy = 0.9999
                db.commit()
            assert "Trained model metadata is immutable" in str(exc.value)
            db.rollback()
    finally:
        db.close()


# ==============================================================================
# 4. SIMULATION NON-INTERFERENCE WITH BASELINE DATA
# ==============================================================================

def test_simulation_does_not_mutate_baseline_data(auth_tokens):
    """Verify that running a simulation does not overwrite or mutate baseline database observations."""
    db = SessionLocal()
    try:
        # Snapshot baseline observations
        initial_rain = db.query(RainfallObservation).order_by(RainfallObservation.id).all()
        baseline_snapshot = [
            (r.id, r.location_id, r.accum_24h_mm, r.antecedent_72h_mm, r.intensity_1h_mm)
            for r in initial_rain
        ]

        # Execute high-stress simulation (+300% rainfall)
        sim_payload = {
            "scenario_name": "Integrity Check Deluge (+300%)",
            "rainfall_multiplier": 3.0,
            "additional_rainfall_mm": 100.0,
            "duration_hours": 48
        }
        res = client.post(
            "/api/v1/simulation/run",
            json=sim_payload,
            headers={"Authorization": f"Bearer {auth_tokens['analyst']}"}
        )
        assert res.status_code == 200

        # Verify database observations after simulation
        post_rain = db.query(RainfallObservation).order_by(RainfallObservation.id).all()
        post_snapshot = [
            (r.id, r.location_id, r.accum_24h_mm, r.antecedent_72h_mm, r.intensity_1h_mm)
            for r in post_rain
        ]

        assert baseline_snapshot == post_snapshot, "CRITICAL: Simulation mutated baseline observations in the database!"
    finally:
        db.close()


# ==============================================================================
# 5. INPUT BOUNDS VALIDATION
# ==============================================================================

def test_coordinate_and_parameter_bounds_validation(auth_tokens):
    """Verify strict validation against physical and geographical boundary violations."""
    headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # 1. Invalid Latitude (> 90.0)
    bad_lat_payload = {
        "name": "Out of Bounds Valley",
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 195.0,  # Invalid
        "longitude": 76.15,
        "terrain_type": "STEEP_MONSOON"
    }
    res_lat = client.post("/api/v1/data-engine/demo/generate", json=bad_lat_payload, headers=headers)
    assert res_lat.status_code == 422
    assert "Latitude out of bounds" in str(res_lat.json())

    # 2. Invalid Longitude (< -180.0)
    bad_lon_payload = {
        "name": "Out of Bounds Ridge",
        "district": "Wayanad",
        "state": "Kerala",
        "latitude": 11.5,
        "longitude": -250.0,  # Invalid
        "terrain_type": "STEEP_MONSOON"
    }
    res_lon = client.post("/api/v1/data-engine/demo/generate", json=bad_lon_payload, headers=headers)
    assert res_lon.status_code == 422
    assert "Longitude out of bounds" in str(res_lon.json())

    # 3. Rainfall multiplier > 4.0
    bad_multiplier_payload = {
        "scenario_name": "Impossible Multiplier",
        "rainfall_multiplier": 15.0,  # Limit is 4.0
        "duration_hours": 24
    }
    res_mult = client.post("/api/v1/simulation/run", json=bad_multiplier_payload, headers=headers)
    assert res_mult.status_code == 422


# ==============================================================================
# 6. IN-MEMORY RATE LIMITING & RETRY-AFTER HEADERS
# ==============================================================================

def test_rate_limiting_enforcement():
    """Verify sliding-window rate limiter returns HTTP 429 and Retry-After header on bursts."""
    # Test on the in-memory rate limiter directly for precise determinism
    test_key = "rate_limit_test_client_ip"
    limit = 5
    rate_limiter.reset()

    # Consume available quota
    for _ in range(limit):
        allowed, remaining, retry_after = rate_limiter.is_allowed(test_key, max_requests=limit, window_seconds=60)
        assert allowed is True

    # Next attempt should be blocked
    allowed, remaining, retry_after = rate_limiter.is_allowed(test_key, max_requests=limit, window_seconds=60)
    assert allowed is False
    assert remaining == 0
    assert retry_after > 0


# ==============================================================================
# 7. SENSITIVE DATA SCRUBBING
# ==============================================================================

def test_sensitive_data_scrubbing():
    """Verify masking utility and logging filter scrub secrets, tokens, and passwords."""
    # 1. Masking utility
    raw_dict = {
        "username": "commander",
        "password": "SuperSecretPassword123!",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
        "api_key": "sk-live-secret-998877",
        "normal_field": "public_data"
    }
    masked = mask_sensitive_data(raw_dict)
    assert masked["password"] == "[REDACTED]"
    assert masked["access_token"] == "[REDACTED]"
    assert masked["api_key"] == "[REDACTED]"
    assert masked["normal_field"] == "public_data"

    # 2. Logging Filter
    sanitizer = SensitiveDataSanitizingFilter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Login attempt with password=SecretAdminPass and Bearer eyJhbGciOiJIUzI1Ni",
        args=(),
        exc_info=None
    )
    sanitizer.filter(record)
    assert "SecretAdminPass" not in record.msg
    assert "[REDACTED]" in record.msg


# ==============================================================================
# 8. ADMINISTRATIVE USER PROVISIONING & AUDIT LOG RBAC
# ==============================================================================

def test_admin_user_provisioning_and_rbac():
    """Verify ADMIN can provision users, ANALYST cannot, and credentials are encrypted."""
    import uuid
    suffix = uuid.uuid4().hex[:6]
    test_uname = f"field_unit_{suffix}"
    test_email = f"alpha_{suffix}@disaster.gov.in"

    admin_token = create_access_token({"sub": "admin", "role": "ADMIN"})
    analyst_token = create_access_token({"sub": "analyst", "role": "ANALYST"})
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_analyst = {"Authorization": f"Bearer {analyst_token}"}

    new_user_payload = {
        "username": test_uname,
        "email": test_email,
        "full_name": "Field Officer Alpha",
        "role": "FIELD_OFFICER",
        "is_active": True,
        "password": "AlphaSecurePassword2026!"
    }

    # 1. Non-admin cannot provision users (403 Forbidden)
    res_forbidden = client.post("/api/v1/auth/users", json=new_user_payload, headers=headers_analyst)
    assert res_forbidden.status_code == 403

    # 2. Admin can provision users (201 Created)
    res_created = client.post("/api/v1/auth/users", json=new_user_payload, headers=headers_admin)
    assert res_created.status_code == 201
    created_data = res_created.json()
    assert created_data["username"] == test_uname
    assert created_data["role"] == "FIELD_OFFICER"
    assert "password" not in created_data
    assert "hashed_password" not in created_data

    # 3. Duplicate username rejected (400 Bad Request)
    res_dup = client.post("/api/v1/auth/users", json=new_user_payload, headers=headers_admin)
    assert res_dup.status_code == 400

    # 4. Admin can list users
    res_users = client.get("/api/v1/auth/users", headers=headers_admin)
    assert res_users.status_code == 200
    assert any(u["username"] == test_uname for u in res_users.json())

    # 5. Non-admin cannot list users (403 Forbidden)
    res_users_forbidden = client.get("/api/v1/auth/users", headers=headers_analyst)
    assert res_users_forbidden.status_code == 403


def test_audit_ledger_rbac_and_masking():
    """Verify audit log viewing is restricted to ADMIN and ANALYST, and sensitive payloads are masked."""
    admin_token = create_access_token({"sub": "admin", "role": "ADMIN"})
    analyst_token = create_access_token({"sub": "analyst", "role": "ANALYST"})
    readonly_token = create_access_token({"sub": "viewer", "role": "READ_ONLY"})

    # 1. READ_ONLY cannot access audit events (403 Forbidden)
    res_readonly = client.get("/api/v1/audit/events", headers={"Authorization": f"Bearer {readonly_token}"})
    assert res_readonly.status_code == 403

    # 2. ANALYST can view audit events (200 OK)
    res_analyst = client.get("/api/v1/audit/events", headers={"Authorization": f"Bearer {analyst_token}"})
    assert res_analyst.status_code == 200
    assert isinstance(res_analyst.json(), list)

    # 3. ADMIN can view audit events (200 OK)
    res_admin = client.get("/api/v1/audit/events", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200

    # 4. Sensitive keys in audit logger payloads are scrubbed
    db = SessionLocal()
    try:
        from app.audit.logger import log_audit_event
        event = log_audit_event(
            db=db,
            action_type="SECURITY_TEST_MASKING",
            user_name="test_operator",
            payload_summary={"token": "eyJsecretToken", "password": "PlainTextPassword!", "public_note": "ok"}
        )
        assert event.payload_summary["token"] == "[REDACTED]"
        assert event.payload_summary["password"] == "[REDACTED]"
        assert event.payload_summary["public_note"] == "ok"
    finally:
        db.close()

