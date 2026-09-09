"""Geospatial Proximity & Infrastructure Impact Analysis Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Computes exact Great-Circle Haversine distances to lifelines within
danger buffer zones around landslide risk catchments.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Location, Infrastructure
from app.data_engine.geospatial.spatial_proximity import haversine_distance_meters


def calculate_catchment_spatial_impact(
    db: Session,
    location_id: int,
    danger_buffer_meters: float = 2500.0
) -> Dict[str, Any]:
    """Calculate exact infrastructure proximity and exposed community assets for a specific catchment."""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise ValueError(f"Location with ID {location_id} not found.")

    origin_lat = location.latitude
    origin_lon = location.longitude

    infrastructures = db.query(Infrastructure).all()

    # Category buckets
    categories: Dict[str, List[Dict[str, Any]]] = {
        "villages": [],
        "roads": [],
        "bridges": [],
        "schools": [],
        "hospitals": [],
        "emergency_facilities": [],
        "other": []
    }

    all_evaluated = []
    exposed_count = 0
    total_exposed_capacity = 0

    for item in infrastructures:
        dist_m = haversine_distance_meters(origin_lat, origin_lon, item.latitude, item.longitude)
        is_inside = dist_m <= danger_buffer_meters

        asset_type_upper = (item.asset_type or "").upper()
        asset_name_upper = (item.name or "").upper()

        if "VILLAGE" in asset_type_upper or "SETTLEMENT" in asset_type_upper:
            cat = "villages"
        elif "ROAD" in asset_type_upper or "HIGHWAY" in asset_type_upper:
            cat = "roads"
        elif "BRIDGE" in asset_type_upper or "CULVERT" in asset_type_upper:
            cat = "bridges"
        elif "SCHOOL" in asset_type_upper or "COLLEGE" in asset_type_upper:
            cat = "schools"
        elif "HOSPITAL" in asset_type_upper or "CLINIC" in asset_type_upper or "HEALTH" in asset_name_upper:
            cat = "hospitals"
        elif "FIRE" in asset_type_upper or "POLICE" in asset_type_upper or "SDRF" in asset_name_upper or "CAMP" in asset_name_upper:
            cat = "emergency_facilities"
        else:
            cat = "other"

        asset_record = {
            "id": item.id,
            "name": item.name,
            "asset_type": item.asset_type,
            "category": cat,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "lifeline_tier": item.lifeline_tier,
            "capacity": item.capacity,
            "exposure_weight": item.exposure_weight,
            "distance_meters": round(dist_m, 1),
            "distance_km": round(dist_m / 1000.0, 2),
            "is_inside_danger_buffer": is_inside
        }

        all_evaluated.append(asset_record)
        categories[cat].append(asset_record)

        if is_inside:
            exposed_count += 1
            total_exposed_capacity += (item.capacity or 0)

    # Sort each category by distance ascending
    nearest_by_category = {}
    for cat, items in categories.items():
        items.sort(key=lambda x: x["distance_meters"])
        nearest_by_category[cat] = items[0] if items else None

    # Closest overall
    all_evaluated.sort(key=lambda x: x["distance_meters"])
    closest_overall = all_evaluated[0] if all_evaluated else None

    # Filter exposed within buffer
    exposed_lifelines = [a for a in all_evaluated if a["is_inside_danger_buffer"]]

    # Impact severity rating based on exposed lifeline tiers
    tier_1_exposed = sum(1 for a in exposed_lifelines if a["lifeline_tier"] == 1)
    if tier_1_exposed >= 2 or exposed_count >= 5:
        impact_rating = "CRITICAL_EXPOSURE"
    elif tier_1_exposed >= 1 or exposed_count >= 2:
        impact_rating = "HIGH_EXPOSURE"
    elif exposed_count >= 1:
        impact_rating = "MODERATE_EXPOSURE"
    else:
        impact_rating = "LOW_EXPOSURE"

    return {
        "location_id": location.id,
        "location_name": location.name,
        "district": location.district,
        "state": location.state,
        "catchment_population": location.population or 0,
        "origin_coordinates": {
            "latitude": origin_lat,
            "longitude": origin_lon
        },
        "danger_buffer_meters": danger_buffer_meters,
        "impact_rating": impact_rating,
        "total_assets_evaluated": len(all_evaluated),
        "total_exposed_count": exposed_count,
        "total_exposed_capacity": total_exposed_capacity,
        "closest_overall": closest_overall,
        "nearest_by_category": nearest_by_category,
        "exposed_lifelines": exposed_lifelines[:15]
    }
