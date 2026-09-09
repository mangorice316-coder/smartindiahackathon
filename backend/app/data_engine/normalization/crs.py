"""Coordinate Reference System (CRS) and geospatial coordinate normalization.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Handles validation of geographic coordinates and mathematical reprojection
between WGS84 (EPSG:4326) and Web Mercator (EPSG:3857) without external GDAL dependencies.
"""
import math
from typing import Tuple, Optional


WGS84_A = 6378137.0  # WGS84 Semi-major axis (meters)
MAX_LATITUDE_MERCATOR = 85.0511287798066


def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """Validate latitude and longitude against geographic planetary boundaries."""
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return False, "Coordinates must be numerical floats"

    if math.isnan(lat) or math.isinf(lat) or math.isnan(lon) or math.isinf(lon):
        return False, "Coordinates cannot be NaN or Infinite"

    if lat < -90.0 or lat > 90.0:
        return False, f"Latitude {lat} deg is out of valid bounds [-90, +90]"

    if lon < -180.0 or lon > 180.0:
        return False, f"Longitude {lon} deg is out of valid bounds [-180, +180]"

    return True, None


def normalize_crs_code(crs: str) -> str:
    """Normalize CRS aliases to uppercase EPSG syntax."""
    c = crs.strip().upper()
    if c in ("EPSG:4326", "WGS84", "WGS-84", "4326", "CRS84"):
        return "EPSG:4326"
    if c in ("EPSG:3857", "WEB MERCATOR", "3857", "EPSG:900913"):
        return "EPSG:3857"
    return c


def wgs84_to_web_mercator(lat: float, lon: float) -> Tuple[float, float]:
    """Project WGS84 decimal degrees (lat, lon) to Web Mercator meters (x, y)."""
    valid, err = validate_coordinates(lat, lon)
    if not valid:
        raise ValueError(err)

    # Clamp latitude to avoid infinity at poles
    clamped_lat = max(min(lat, MAX_LATITUDE_MERCATOR), -MAX_LATITUDE_MERCATOR)

    x = lon * (WGS84_A * math.pi / 180.0)
    lat_rad = math.radians(clamped_lat)
    y = WGS84_A * math.log(math.tan(math.pi / 4.0 + lat_rad / 2.0))
    return x, y


def web_mercator_to_wgs84(x: float, y: float) -> Tuple[float, float]:
    """Inverse project Web Mercator meters (x, y) to WGS84 (lat, lon)."""
    lon = (x / WGS84_A) * (180.0 / math.pi)
    lat = (2.0 * math.atan(math.exp(y / WGS84_A)) - math.pi / 2.0) * (180.0 / math.pi)

    # Wrap longitude to [-180, 180]
    lon = ((lon + 180.0) % 360.0) - 180.0
    return lat, lon
