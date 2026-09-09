"""Rainfall What-If Simulation API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides endpoints for executing isolated rainfall scenarios, comparing scenarios,
serving GeoJSON difference layers, generating SITREP assessment reports,
and retrieving time-series storm projections.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Body, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import Simulation, User
from app.auth.security import require_role
from app.models.schemas import (
    SimulationRequest,
    SimulationResponse,
    SimulationComparisonRequest,
    SimulationComparisonResponse,
    SimulationReportRequest,
    SimulationReportResponse,
    SimulationTimeSeriesRequest,
    SimulationTimeSeriesResponse
)
from app.simulation.simulator import (
    run_rainfall_simulation,
    compare_rainfall_scenarios,
    generate_simulation_geojson,
    generate_simulation_report,
    project_simulation_timeseries
)
from app.simulation.scenario_cache import scenario_cache

router = APIRouter(prefix="/simulation", tags=["What-If Rainfall Simulation"])


@router.post("/run", response_model=SimulationResponse)
def execute_simulation(
    request: SimulationRequest = Body(...),
    use_cache: bool = Query(True, description="Enable LRU scenario caching"),
    user_name: Optional[str] = None,
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
):
    """Execute what-if rainfall simulation across all monitored sub-catchments. Restricted to ADMIN and ANALYST."""
    operator = user_name or current_user.username
    return run_rainfall_simulation(db=db, request=request, user_name=operator, use_cache=use_cache)


@router.post("/compare", response_model=SimulationComparisonResponse)
def compare_scenarios(
    payload: SimulationComparisonRequest = Body(...),
    user_name: Optional[str] = None,
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
):
    """Directly compare Scenario A against Scenario B to evaluate differential risk escalations."""
    operator = user_name or current_user.username
    return compare_rainfall_scenarios(db=db, request_a=payload.scenario_a, request_b=payload.scenario_b, user_name=operator)


@router.post("/geojson")
def get_simulation_map_layer(
    request: SimulationRequest = Body(...),
    layer_type: str = Query("difference", description="Layer type: baseline, scenario, or difference"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieve GeoJSON FeatureCollection for interactive map rendering (baseline, scenario, or delta)."""
    return generate_simulation_geojson(db=db, request=request, layer_type=layer_type.lower())


@router.post("/report", response_model=SimulationReportResponse)
def export_scenario_report(
    payload: SimulationReportRequest = Body(...),
    current_user: User = Depends(require_role("ADMIN", "ANALYST")),
    db: Session = Depends(get_db)
):
    """Generate a formal landslide risk scenario assessment report (JSON, HTML, or Markdown SITREP)."""
    return generate_simulation_report(db=db, request=payload.scenario, report_format=payload.report_format.lower())


@router.post("/timeseries", response_model=SimulationTimeSeriesResponse)
def get_scenario_timeseries(
    request: SimulationTimeSeriesRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Project hourly precipitation surge and risk escalation curves over the modeled storm window."""
    try:
        return project_simulation_timeseries(db=db, request=request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history")
def get_simulation_history(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Retrieve history of scenario simulation runs with parameter records."""
    sims = db.query(Simulation).order_by(Simulation.created_at.desc()).limit(25).all()
    return [
        {
            "id": s.id,
            "scenario_name": s.scenario_name,
            "created_at": s.created_at.isoformat(),
            "rainfall_multiplier": s.rainfall_multiplier,
            "additional_rainfall_mm": s.additional_rainfall_mm,
            "duration_hours": s.duration_hours,
            "soil_saturation_factor": s.soil_saturation_factor,
            "results_summary": s.results_summary_json,
            "executed_by": s.executed_by_user
        } for s in sims
    ]


@router.get("/cache/stats")
def get_cache_statistics() -> Dict[str, Any]:
    """Retrieve scenario cache performance and hit/miss statistics."""
    return scenario_cache.get_stats()


@router.post("/cache/clear")
def clear_scenario_cache() -> Dict[str, str]:
    """Manually evict all cached scenario evaluations."""
    scenario_cache.clear()
    return {"message": "Scenario cache successfully cleared."}
