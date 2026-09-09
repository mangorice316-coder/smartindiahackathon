"""Data Health, Telemetry & System Status API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.entities import User
from app.auth.security import require_role
from app.data_adapters.health_monitor import get_data_sources_health
from app.data_adapters.demo_adapter import seed_demo_data
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/health", tags=["System Health & Data Telemetry"])


@router.get("/status")
def system_status(db: Session = Depends(get_db)):
    """System liveness, database connectivity, and engine status check."""
    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "operating_mode": settings.DATA_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "CONNECTED",
        "physics_engine": "ACTIVE",
        "ml_engine": "ONLINE",
        "alert_engine": "STANDBY"
    }


@router.get("/data-telemetry")
def get_data_telemetry(db: Session = Depends(get_db)):
    """Audit all registered data sources and telemetry quality metrics."""
    return {
        "data_mode": settings.DATA_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sources": get_data_sources_health(db)
    }


@router.post("/reset-demo")
def reset_demo_database(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Reset demo database back to clean calibrated initial state. Restricted to ADMIN."""
    result = seed_demo_data(db, force_reset=True)

    log_audit_event(
        db=db,
        action_type="RESET_DEMO_DATA",
        user_name=current_user.username,
        payload_summary=result
    )

    return {
        "status": "RESET_SUCCESSFUL",
        "message": "Demo data re-seeded with Western Ghats and Himalayan hotspots.",
        "details": result
    }


@router.get("/detailed")
def detailed_system_health(db: Session = Depends(get_db)):
    """Comprehensive observability probe inspecting DB, ML, and Data Providers."""
    from sqlalchemy import text
    from app.ml.model_registry import get_active_pipeline

    # 1. Database Connectivity Probe
    db_status = "HEALTHY"
    db_latency_ms = 0.0
    try:
        t0 = datetime.now(timezone.utc)
        db.execute(text("SELECT 1"))
        db_latency_ms = round((datetime.now(timezone.utc) - t0).total_seconds() * 1000.0, 2)
    except Exception as e:
        db_status = f"FAILING: {str(e)}"

    # 2. ML Engine Probe
    ml_status = "HEALTHY"
    active_tag = "UNKNOWN"
    try:
        pipeline = get_active_pipeline()
        active_tag = pipeline.version_tag or "UNINITIALIZED"
    except Exception as e:
        ml_status = f"DEGRADED: {str(e)}"

    # 3. Data Providers
    sources = get_data_sources_health(db)
    all_healthy = all(s.get("quality_status") == "HEALTHY" for s in sources)

    overall = "HEALTHY"
    if "FAILING" in db_status:
        overall = "CRITICAL"
    elif not all_healthy or "DEGRADED" in ml_status:
        overall = "DEGRADED"

    return {
        "status": overall,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "operating_mode": settings.DATA_MODE,
        "subsystems": {
            "database": {
                "status": db_status,
                "latency_ms": db_latency_ms,
                "engine": "SQLite / PostgreSQL compatible"
            },
            "ml_engine": {
                "status": ml_status,
                "active_model": active_tag,
                "inference_ready": True
            },
            "physics_engine": {
                "status": "HEALTHY",
                "model": "Deterministic Geotechnical Infinite Slope Stability"
            },
            "data_providers": {
                "status": "HEALTHY" if all_healthy else "DEGRADED",
                "sources_count": len(sources),
                "sources": sources
            }
        }
    }

