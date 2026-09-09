"""Locations & Catchments Management API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Location
from app.models.schemas import LocationSummary, LocationDetail

router = APIRouter(prefix="/locations", tags=["Locations & Catchments"])


@router.get("", response_model=List[LocationSummary])
def list_locations(
    district: Optional[str] = Query(None, description="Filter by district"),
    state: Optional[str] = Query(None, description="Filter by state"),
    db: Session = Depends(get_db)
):
    """Retrieve list of monitored sub-catchments and operational zones."""
    query = db.query(Location)
    if district:
        query = query.filter(Location.district.ilike(f"%{district}%"))
    if state:
        query = query.filter(Location.state.ilike(f"%{state}%"))
    return query.all()


@router.get("/{location_id}", response_model=LocationDetail)
def get_location_detail(location_id: int, db: Session = Depends(get_db)):
    """Retrieve complete geotechnical, terrain, hydrological, and infrastructure detail for a zone."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found.")

    latest_rain = loc.rainfall_observations[-1] if loc.rainfall_observations else None
    latest_env = loc.environmental_observations[-1] if loc.environmental_observations else None

    return {
        "id": loc.id,
        "code": loc.code,
        "name": loc.name,
        "taluk": loc.taluk,
        "district": loc.district,
        "state": loc.state,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "elevation_m": loc.elevation_m,
        "area_km2": loc.area_km2,
        "population": loc.population,
        "boundary_geojson": loc.boundary_geojson,
        "is_demo": loc.is_demo,
        "terrain_feature": loc.terrain_feature,
        "soil_feature": loc.soil_feature,
        "geology_feature": loc.geology_feature,
        "land_cover_feature": loc.land_cover_feature,
        "latest_rainfall": latest_rain,
        "latest_environment": latest_env,
        "infrastructures": loc.infrastructures,
        "historical_landslides": loc.historical_landslides
    }
