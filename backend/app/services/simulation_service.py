"""Rainfall What-If Simulation Domain Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Simulation
from app.models.schemas import SimulationRequest, SimulationResponse
from app.simulation.simulator import run_rainfall_simulation


class SimulationService:
    """Service managing what-if scenario simulations and historical simulation records."""

    @staticmethod
    def execute_scenario(db: Session, request: SimulationRequest, user_name: str = "SYSTEM_ANALYST") -> SimulationResponse:
        return run_rainfall_simulation(db=db, request=request, user_name=user_name)

    @staticmethod
    def list_history(db: Session, limit: int = 25) -> List[Simulation]:
        return db.query(Simulation).order_by(Simulation.created_at.desc()).limit(limit).all()
