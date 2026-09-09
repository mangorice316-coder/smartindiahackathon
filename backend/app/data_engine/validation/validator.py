"""Comprehensive data validation engine for geotechnical, geospatial, and meteorological records.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Validates bounds, coordinates, timestamps, spikes, missing values, and duplicates.
CRITICAL CONSTRAINT: Questionable observations are marked and preserved with detailed
audit flags instead of being silently deleted.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Set, Tuple
from app.data_engine.types import (
    CommonGeographicRecord,
    DataCategory,
    DataQualityStatus,
    ValidationFlag,
    ValidationSeverity,
    ValidationResult,
)
from app.data_engine.normalization.crs import validate_coordinates


# Physical bounds dictionary: (min_value, max_value, unit, field_description)
PHYSICAL_BOUNDS = {
    "slope_degrees": (0.0, 90.0, "deg", "Slope inclination must be between 0 and 90 degrees"),
    "aspect_degrees": (0.0, 360.0, "deg", "Aspect direction must be between 0 and 360 degrees"),
    "elevation_m": (-500.0, 9000.0, "m", "Elevation must be between -500m and 9000m"),
    "intensity_1h_mm": (0.0, 400.0, "mm/h", "Hourly rainfall intensity must be between 0 and 400 mm/h"),
    "accum_24h_mm": (0.0, 1500.0, "mm", "24h rainfall accumulation must be between 0 and 1500 mm"),
    "antecedent_72h_mm": (0.0, 3000.0, "mm", "72h antecedent rainfall must be between 0 and 3000 mm"),
    "cohesion_kpa": (0.0, 300.0, "kPa", "Soil shear cohesion must be non-negative and under 300 kPa"),
    "friction_angle_deg": (0.0, 60.0, "deg", "Internal friction angle must be between 0 and 60 degrees"),
    "soil_depth_m": (0.05, 50.0, "m", "Soil depth must be between 0.05m and 50m"),
    "bulk_density_kn_m3": (5.0, 35.0, "kN/m3", "Soil bulk unit weight must be between 5 and 35 kN/m^3"),
    "soil_moisture_ratio": (0.0, 1.0, "ratio", "Volumetric soil moisture must be between 0.0 and 1.0"),
    "ndvi_index": (-1.0, 1.0, "index", "NDVI vegetation index must be between -1.0 and +1.0"),
    "tree_canopy_pct": (0.0, 100.0, "%", "Tree canopy coverage must be between 0% and 100%"),
    "road_cut_distance_m": (0.0, 100000.0, "m", "Distance to road cut must be positive"),
    "fault_distance_m": (0.0, 500000.0, "m", "Distance to fault line must be positive"),
}

CATEGORY_REQUIRED_FIELDS = {
    DataCategory.RAINFALL: ["intensity_1h_mm", "accum_24h_mm"],
    DataCategory.TERRAIN: ["slope_degrees", "elevation_m"],
    DataCategory.SOIL: ["cohesion_kpa", "friction_angle_deg"],
    DataCategory.LAND_COVER: ["ndvi_index"],
    DataCategory.GEOLOGY: ["lithology_class"],
}


class DataValidator:
    """Stateful or stateless validator for environmental and geotechnical observations."""

    def __init__(self):
        self._seen_hashes: Set[str] = set()

    def validate_record(
        self,
        record: CommonGeographicRecord,
        previous_record: Optional[CommonGeographicRecord] = None,
        check_duplicate: bool = True
    ) -> ValidationResult:
        """Execute full validation pipeline against a CommonGeographicRecord."""
        flags: List[ValidationFlag] = list(record.validation_flags)
        quality_status = DataQualityStatus.HEALTHY

        # 1. Coordinate Validation
        coord_valid, coord_err = validate_coordinates(record.latitude, record.longitude)
        if not coord_valid:
            flags.append(ValidationFlag(
                code="INVALID_COORDINATES",
                message=coord_err or "Coordinates outside geographic bounds",
                severity=ValidationSeverity.CRITICAL,
                field="latitude/longitude",
                raw_value=(record.latitude, record.longitude)
            ))
            quality_status = DataQualityStatus.FAILING

        # 2. Timestamp Validation (no dates > 24h into future, none before 1900)
        now_utc = datetime.now(timezone.utc)
        record_ts = record.timestamp
        if record_ts.tzinfo is None:
            record_ts = record_ts.replace(tzinfo=timezone.utc)

        if record_ts > now_utc + timedelta(hours=24):
            flags.append(ValidationFlag(
                code="IMPOSSIBLE_FUTURE_TIMESTAMP",
                message=f"Observation timestamp {record_ts.isoformat()} is in the future",
                severity=ValidationSeverity.ERROR,
                field="timestamp",
                raw_value=record_ts.isoformat()
            ))
            quality_status = DataQualityStatus.SUSPICIOUS
        elif record_ts < datetime(1900, 1, 1, tzinfo=timezone.utc):
            flags.append(ValidationFlag(
                code="ANCIENT_TIMESTAMP",
                message=f"Observation timestamp {record_ts.isoformat()} is prior to 1900",
                severity=ValidationSeverity.WARNING,
                field="timestamp",
                raw_value=record_ts.isoformat()
            ))

        # 3. Duplicate Record Detection
        if check_duplicate:
            dup_hash = (
                f"{record.category}:{round(record.latitude, 4)}:{round(record.longitude, 4)}:"
                f"{record_ts.strftime('%Y-%m-%d %H:%M')}"
            )
            if dup_hash in self._seen_hashes:
                flags.append(ValidationFlag(
                    code="DUPLICATE_RECORD",
                    message="Duplicate spatial-temporal observation detected for this minute and location",
                    severity=ValidationSeverity.WARNING,
                    field="timestamp",
                    raw_value=dup_hash
                ))
                if quality_status == DataQualityStatus.HEALTHY:
                    quality_status = DataQualityStatus.DUPLICATE
            else:
                self._seen_hashes.add(dup_hash)

        # 4. Missing Fields & Incomplete Record Check
        required = CATEGORY_REQUIRED_FIELDS.get(record.category, [])
        missing_fields = []
        for req_f in required:
            val = record.payload.get(req_f)
            if val is None:
                missing_fields.append(req_f)

        if missing_fields:
            flags.append(ValidationFlag(
                code="INCOMPLETE_RECORD",
                message=f"Category {record.category.value} missing critical parameters: {', '.join(missing_fields)}",
                severity=ValidationSeverity.WARNING,
                field=", ".join(missing_fields),
                raw_value=None
            ))
            if quality_status in (DataQualityStatus.HEALTHY, DataQualityStatus.DUPLICATE):
                quality_status = DataQualityStatus.INCOMPLETE

        # 5. Physical Range / Out-of-Range Checks
        all_numeric_fields = dict(record.payload)
        if record.elevation_m is not None:
            all_numeric_fields["elevation_m"] = record.elevation_m

        for field_name, value in all_numeric_fields.items():
            if isinstance(value, (int, float)):
                bounds = PHYSICAL_BOUNDS.get(field_name)
                if bounds:
                    b_min, b_max, unit, desc = bounds
                    if value < b_min or value > b_max:
                        flags.append(ValidationFlag(
                            code="OUT_OF_RANGE_VALUE",
                            message=f"Value {value} {unit} for '{field_name}' violates boundary [{b_min}, {b_max}] {unit}. {desc}",
                            severity=ValidationSeverity.ERROR,
                            field=field_name,
                            raw_value=value
                        ))
                        quality_status = DataQualityStatus.OUT_OF_RANGE

        # 6. Spike / Sudden Jump Detection (against previous record)
        if previous_record and previous_record.category == record.category:
            prev_payload = previous_record.payload
            curr_payload = record.payload

            # Check rainfall spike
            curr_rain = curr_payload.get("intensity_1h_mm")
            prev_rain = prev_payload.get("intensity_1h_mm")
            if curr_rain is not None and prev_rain is not None:
                delta = abs(curr_rain - prev_rain)
                if delta > 120.0:  # >120 mm/h sudden jump
                    flags.append(ValidationFlag(
                        code="UNEXPECTED_RAINFALL_SPIKE",
                        message=f"Abrupt 1h intensity change of {delta:.1f} mm/h from previous reading ({prev_rain} -> {curr_rain})",
                        severity=ValidationSeverity.WARNING,
                        field="intensity_1h_mm",
                        raw_value=delta
                    ))
                    if quality_status not in (DataQualityStatus.OUT_OF_RANGE, DataQualityStatus.FAILING):
                        quality_status = DataQualityStatus.SPIKE

            # Check soil moisture jump
            curr_sm = curr_payload.get("soil_moisture_ratio")
            prev_sm = prev_payload.get("soil_moisture_ratio")
            if curr_sm is not None and prev_sm is not None:
                delta_sm = abs(curr_sm - prev_sm)
                if delta_sm > 0.45:  # >45% moisture jump
                    flags.append(ValidationFlag(
                        code="UNEXPECTED_MOISTURE_JUMP",
                        message=f"Abrupt soil moisture change of {delta_sm:.2f} between consecutive observations",
                        severity=ValidationSeverity.WARNING,
                        field="soil_moisture_ratio",
                        raw_value=delta_sm
                    ))
                    if quality_status not in (DataQualityStatus.OUT_OF_RANGE, DataQualityStatus.FAILING):
                        quality_status = DataQualityStatus.SPIKE

        record.validation_flags = flags
        record.quality_status = quality_status

        clean_payload = {}
        for k, v in record.payload.items():
            clean_payload[k] = v

        return ValidationResult(
            is_valid=(quality_status not in (DataQualityStatus.FAILING, DataQualityStatus.OUT_OF_RANGE)),
            quality_status=quality_status,
            flags=flags,
            clean_data=clean_payload,
            raw_data=record.payload,
            message=f"Validated with quality status {quality_status.value} ({len(flags)} flags recorded)"
        )

    def clear_duplicate_cache(self):
        """Reset seen hashes cache."""
        self._seen_hashes.clear()
