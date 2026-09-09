"""Geospatial proximity and critical infrastructure distance calculation engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Calculates rigorous geodesic Haversine distance between landslide hazard zones
and critical lifeline infrastructure:
- Villages
- Roads & Highways
- Bridges & Culverts
- Schools & Educational Centers
- Hospitals & Clinics
- Emergency Facilities (Fire, Police, NDRF staging)
"""
import math
from typing import Dict, Any, List, Optional, Tuple


EARTH_RADIUS_METERS = 6371000.0


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two WGS84 points in meters."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_METERS * c


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in kilometers."""
    return haversine_distance_meters(lat1, lon1, lat2, lon2) / 1000.0


REQUIRED_ASSET_TYPES = [
    "VILLAGE",
    "ROAD",
    "BRIDGE",
    "SCHOOL",
    "HOSPITAL",
    "EMERGENCY_FACILITY",
]


def classify_asset_type(raw_type: str) -> str:
    """Map arbitrary asset types into standardized disaster management categories."""
    t = raw_type.strip().upper()
    if any(k in t for k in ("HOSPITAL", "HEALTH", "CLINIC", "DISPENSARY", "MEDICAL")):
        return "HOSPITAL"
    if any(k in t for k in ("SCHOOL", "COLLEGE", "UNIVERSITY", "EDUCATION", "CAMPUS")):
        return "SCHOOL"
    if any(k in t for k in ("BRIDGE", "FLYOVER", "CULVERT", "VIADUCT")):
        return "BRIDGE"
    if any(k in t for k in ("VILLAGE", "SETTLEMENT", "HAMLET", "RESIDENTIAL", "COMMUNITY")):
        return "VILLAGE"
    if any(k in t for k in ("EMERGENCY", "FIRE", "POLICE", "RESCUE", "NDRF", "STATION")):
        return "EMERGENCY_FACILITY"
    if any(k in t for k in ("HIGHWAY", "ROAD", "EXPRESSWAY", "STREET", "ROUTE")):
        return "ROAD"
    return "ROAD"


def calculate_infrastructure_proximity(
    origin_lat: float,
    origin_lon: float,
    assets: List[Dict[str, Any]],
    danger_buffer_meters: float = 500.0
) -> Dict[str, Any]:
    """Find the nearest infrastructure asset in each category and evaluate danger exposure.

    Args:
        origin_lat: Latitude of landslide hazard centroid or slip face
        origin_lon: Longitude of landslide hazard centroid or slip face
        assets: Catalog of infrastructure items (each with name, latitude, longitude, asset_type)
        danger_buffer_meters: Radius in meters inside which infrastructure is deemed directly exposed

    Returns:
        Structured breakdown with nearest asset per category, minimum distance, and exposed lifelines.
    """
    categorized_nearest: Dict[str, Optional[Dict[str, Any]]] = {k: None for k in REQUIRED_ASSET_TYPES}
    all_evaluated = []

    for item in assets:
        lat = item.get("latitude")
        lon = item.get("longitude")
        if lat is None or lon is None:
            continue

        dist_m = haversine_distance_meters(origin_lat, origin_lon, float(lat), float(lon))
        std_type = classify_asset_type(item.get("asset_type", "ROAD"))

        asset_eval = {
            "name": item.get("name", "Unnamed Asset"),
            "asset_type": std_type,
            "latitude": float(lat),
            "longitude": float(lon),
            "distance_meters": round(dist_m, 1),
            "distance_km": round(dist_m / 1000.0, 3),
            "lifeline_tier": item.get("lifeline_tier", 2),
            "capacity": item.get("capacity", 100),
            "exposure_weight": item.get("exposure_weight", 0.7),
            "is_inside_danger_buffer": dist_m <= danger_buffer_meters,
        }
        all_evaluated.append(asset_eval)

        current_nearest = categorized_nearest[std_type]
        if current_nearest is None or dist_m < current_nearest["distance_meters"]:
            categorized_nearest[std_type] = asset_eval

    # Filter out empty categories and identify all assets inside danger buffer
    exposed_lifelines = [a for a in all_evaluated if a["is_inside_danger_buffer"]]
    min_distance_overall = min((a["distance_meters"] for a in all_evaluated), default=float("inf"))

    return {
        "origin_coordinates": {"latitude": origin_lat, "longitude": origin_lon},
        "danger_buffer_meters": danger_buffer_meters,
        "nearest_by_category": categorized_nearest,
        "closest_overall_asset": min(all_evaluated, key=lambda a: a["distance_meters"]) if all_evaluated else None,
        "closest_distance_meters": round(min_distance_overall, 1) if min_distance_overall != float("inf") else None,
        "total_assets_evaluated": len(all_evaluated),
        "total_exposed_lifelines_count": len(exposed_lifelines),
        "exposed_lifelines": exposed_lifelines,
    }
