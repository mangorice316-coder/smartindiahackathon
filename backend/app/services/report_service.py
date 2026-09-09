"""Emergency Situation Report (SitRep) Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.reports.generator import generate_situation_report


class ReportService:
    """Service generating structured JSON and printable emergency situation reports."""

    @staticmethod
    def generate_sitrep(db: Session, area_name: str = "Western Ghats & Himalayas") -> Dict[str, Any]:
        return generate_situation_report(db=db, area_name=area_name)
