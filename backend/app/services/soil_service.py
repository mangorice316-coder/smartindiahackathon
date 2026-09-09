"""Soil Geotechnical Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import SoilFeature, Location
from app.core.exceptions import InvalidLocationError


class SoilService:
    """Service managing soil mechanics and hydraulic properties."""

    @staticmethod
    def get_soil_for_location(db: Session, location_id: int) -> Optional[SoilFeature]:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise InvalidLocationError(f"Location ID {location_id} not found.")
        return loc.soil_feature

    @staticmethod
    def update_soil(db: Session, location_id: int, data: Dict[str, Any]) -> SoilFeature:
        sf = db.query(SoilFeature).filter(SoilFeature.location_id == location_id).first()
        if not sf:
            sf = SoilFeature(location_id=location_id)
            db.add(sf)

        for key, val in data.items():
            if hasattr(sf, key):
                setattr(sf, key, val)

        db.commit()
        db.refresh(sf)
        return sf
