"""Normalization pipeline transforming heterogeneous external data into CommonGeographicRecord.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Ensures standardized units, EPSG:4326 CRS, and ISO UTC timestamps across all categories.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.data_engine.types import (
    CommonGeographicRecord,
    DataCategory,
    DatasetType,
    DataQualityStatus,
    ValidationFlag,
    ValidationSeverity,
)
from app.data_engine.normalization.units import convert_units, normalize_unit_string
from app.data_engine.normalization.crs import (
    validate_coordinates,
    normalize_crs_code,
    web_mercator_to_wgs84,
)


STANDARD_TARGET_UNITS = {
    "slope_degrees": ("deg", "Angle of inclination"),
    "aspect_degrees": ("deg", "Compass direction of slope face"),
    "elevation_m": ("m", "Orthometric elevation"),
    "soil_depth_m": ("m", "Regolith depth to bedrock"),
    "fault_distance_m": ("m", "Distance to geological fault line"),
    "road_cut_distance_m": ("m", "Distance to engineered road cut"),
    "intensity_1h_mm": ("mm/h", "One-hour rainfall intensity"),
    "accum_24h_mm": ("mm", "24-hour rainfall accumulation"),
    "antecedent_72h_mm": ("mm", "72-hour antecedent rainfall"),
    "cohesion_kpa": ("kPa", "Effective soil shear cohesion"),
    "friction_angle_deg": ("deg", "Effective internal angle of shearing resistance"),
    "bulk_density_kn_m3": ("kN/m3", "Total moist unit weight"),
    "ksat_mm_hr": ("mm/h", "Saturated hydraulic conductivity"),
    "soil_moisture_ratio": ("ratio", "Volumetric water content [0.0 - 1.0]"),
}


def normalize_timestamp(raw_ts: Any) -> datetime:
    """Coerce various timestamp formats into UTC timezone-aware datetime."""
    if isinstance(raw_ts, datetime):
        if raw_ts.tzinfo is None:
            return raw_ts.replace(tzinfo=timezone.utc)
        return raw_ts.astimezone(timezone.utc)

    if isinstance(raw_ts, (int, float)):
        # Epoch timestamp (seconds or milliseconds)
        if raw_ts > 1e11:  # Milliseconds
            raw_ts /= 1000.0
        return datetime.fromtimestamp(raw_ts, tz=timezone.utc)

    if isinstance(raw_ts, str):
        cleaned = raw_ts.strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(cleaned)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except ValueError:
            pass

    # Fallback to current UTC time
    return datetime.now(timezone.utc)


def normalize_record(
    raw_data: Dict[str, Any],
    category: DataCategory,
    source_attribution: str,
    dataset_type: DatasetType = DatasetType.DEMO,
    input_units: Optional[Dict[str, str]] = None,
    input_crs: str = "EPSG:4326"
) -> CommonGeographicRecord:
    """Normalize arbitrary provider record into CommonGeographicRecord."""
    input_units = input_units or {}
    crs_norm = normalize_crs_code(input_crs)

    # 1. Coordinate Extraction & CRS handling
    lat = float(raw_data.get("latitude") or raw_data.get("lat") or 0.0)
    lon = float(raw_data.get("longitude") or raw_data.get("lon") or raw_data.get("lng") or 0.0)

    if crs_norm == "EPSG:3857":
        lat, lon = web_mercator_to_wgs84(lon, lat)
        crs_norm = "EPSG:4326"

    # 2. Timestamp extraction
    ts = normalize_timestamp(raw_data.get("timestamp") or raw_data.get("datetime") or raw_data.get("time"))

    # 3. Elevation & Region
    elevation_m = raw_data.get("elevation_m") or raw_data.get("elevation") or raw_data.get("altitude")
    if elevation_m is not None:
        elev_unit = input_units.get("elevation_m") or input_units.get("elevation", "m")
        try:
            elevation_m = convert_units(float(elevation_m), elev_unit, "m")
        except Exception:
            elevation_m = float(elevation_m)

    region = str(raw_data.get("region") or raw_data.get("location_name") or raw_data.get("catchment") or "General Catchment")

    # 4. Payload normalization and unit conversion
    normalized_payload: Dict[str, Any] = {}
    normalized_units: Dict[str, str] = {}
    flags = []

    for k, v in raw_data.items():
        if k in ("latitude", "lat", "longitude", "lon", "lng", "timestamp", "datetime", "region", "location_name", "crs"):
            continue

        if isinstance(v, (int, float)):
            target_meta = STANDARD_TARGET_UNITS.get(k)
            if target_meta and k in input_units:
                src_unit = input_units[k]
                tgt_unit = target_meta[0]
                try:
                    v_converted = convert_units(float(v), src_unit, tgt_unit)
                    normalized_payload[k] = v_converted
                    normalized_units[k] = tgt_unit
                except Exception as e:
                    normalized_payload[k] = float(v)
                    normalized_units[k] = src_unit
                    flags.append(ValidationFlag(
                        code="UNIT_CONVERSION_FAILED",
                        message=f"Could not convert {k} from {src_unit} to {tgt_unit}: {str(e)}",
                        severity=ValidationSeverity.WARNING,
                        field=k,
                        raw_value=v
                    ))
            elif target_meta:
                normalized_payload[k] = float(v)
                normalized_units[k] = target_meta[0]
            else:
                normalized_payload[k] = float(v)
                normalized_units[k] = input_units.get(k, "dimensionless")
        else:
            normalized_payload[k] = v

    return CommonGeographicRecord(
        latitude=round(lat, 6),
        longitude=round(lon, 6),
        elevation_m=round(elevation_m, 2) if elevation_m is not None else None,
        region=region,
        timestamp=ts,
        crs=crs_norm,
        category=category,
        units=normalized_units,
        payload=normalized_payload,
        dataset_type=dataset_type,
        source_attribution=source_attribution,
        quality_status=DataQualityStatus.HEALTHY if not flags else DataQualityStatus.SUSPICIOUS,
        validation_flags=flags,
        metadata={"normalized_at": datetime.now(timezone.utc).isoformat()}
    )
