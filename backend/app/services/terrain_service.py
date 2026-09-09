"""Terrain Geomorphology Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import TerrainFeature, Location
from app.core.exceptions import InvalidLocationError


class TerrainService:
    """Service managing terrain elevation and slope characteristics."""

    @staticmethod
    def get_terrain_for_location(db: Session, location_id: int) -> Optional[TerrainFeature]:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise InvalidLocationError(f"Location ID {location_id} not found.")
        return loc.terrain_feature

    @staticmethod
    def update_terrain(db: Session, location_id: int, data: Dict[str, Any]) -> TerrainFeature:
        tf = db.query(TerrainFeature).filter(TerrainFeature.location_id == location_id).first()
        if not tf:
            tf = TerrainFeature(location_id=location_id)
            db.add(tf)

        for key, val in data.items():
            if hasattr(tf, key):
                setattr(tf, key, val)

        db.commit()
        db.refresh(tf)
        return tf
