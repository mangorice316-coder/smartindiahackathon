"""Data Quality & Telemetry Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.data_adapters.health_monitor import get_data_sources_health
from app.data_adapters.demo_adapter import seed_demo_data


class DataQualityService:
    """Service auditing data providers, telemetry freshness, and database reset."""

    @staticmethod
    def get_sources_health(db: Session) -> List[Dict[str, Any]]:
        return get_data_sources_health(db)

    @staticmethod
    def reset_demo_environment(db: Session) -> Dict[str, Any]:
        return seed_demo_data(db, force_reset=True)
