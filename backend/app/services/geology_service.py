"""Structural Geology Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import GeologyFeature, Location
from app.core.exceptions import InvalidLocationError


class GeologyService:
    """Service managing lithology and tectonic fault features."""

    @staticmethod
    def get_geology_for_location(db: Session, location_id: int) -> Optional[GeologyFeature]:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise InvalidLocationError(f"Location ID {location_id} not found.")
        return loc.geology_feature

    @staticmethod
    def update_geology(db: Session, location_id: int, data: Dict[str, Any]) -> GeologyFeature:
        gf = db.query(GeologyFeature).filter(GeologyFeature.location_id == location_id).first()
        if not gf:
            gf = GeologyFeature(location_id=location_id)
            db.add(gf)

        for key, val in data.items():
            if hasattr(gf, key):
                setattr(gf, key, val)

        db.commit()
        db.refresh(gf)
        return gf
