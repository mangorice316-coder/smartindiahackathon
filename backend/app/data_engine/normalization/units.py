"""Unit normalization and conversion system for geotechnical and meteorological quantities.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Prevents common engineering discrepancies:
- meters vs kilometers
- degrees vs radians
- millimeters vs meters
- hourly vs daily rainfall rates
- kPa vs Pa pressure/cohesion
"""
import math
from typing import Dict, Tuple

UNIT_METERS = "m"
UNIT_KILOMETERS = "km"
UNIT_FEET = "ft"

UNIT_DEGREES = "deg"
UNIT_RADIANS = "rad"

UNIT_MILLIMETERS = "mm"
UNIT_MILLIMETERS_PER_HOUR = "mm/h"
UNIT_MILLIMETERS_PER_DAY = "mm/day"

UNIT_KILOPASCALS = "kPa"
UNIT_PASCALS = "Pa"
UNIT_BAR = "bar"

UNIT_KN_PER_M3 = "kN/m3"
UNIT_KG_PER_M3 = "kg/m3"

STANDARD_GRAVITY = 9.80665  # m/s^2


def meters_to_km(meters: float) -> float:
    return meters / 1000.0


def km_to_meters(km: float) -> float:
    return km * 1000.0


def feet_to_meters(feet: float) -> float:
    return feet * 0.3048


def meters_to_feet(meters: float) -> float:
    return meters / 0.3048


def deg_to_rad(degrees: float) -> float:
    return math.radians(degrees)


def rad_to_deg(radians: float) -> float:
    return math.degrees(radians)


def mm_to_meters(mm: float) -> float:
    return mm / 1000.0


def meters_to_mm(meters: float) -> float:
    return meters * 1000.0


def hourly_rate_to_daily_accum(hourly_rate_mm_h: float, duration_hours: float = 24.0) -> float:
    """Project equivalent accumulation from sustained intensity."""
    return hourly_rate_mm_h * duration_hours


def daily_accum_to_avg_hourly_intensity(daily_accum_mm: float, hours: float = 24.0) -> float:
    """Calculate mean intensity across duration."""
    if hours <= 0:
        raise ValueError("Duration hours must be positive")
    return daily_accum_mm / hours


def kpa_to_pa(kpa: float) -> float:
    return kpa * 1000.0


def pa_to_kpa(pa: float) -> float:
    return pa / 1000.0


def bar_to_kpa(bar: float) -> float:
    return bar * 100.0


def kn_m3_to_kg_m3(kn_m3: float) -> float:
    """Convert bulk unit weight (kN/m^3) to bulk density (kg/m^3)."""
    return (kn_m3 * 1000.0) / STANDARD_GRAVITY


def kg_m3_to_kn_m3(kg_m3: float) -> float:
    """Convert bulk density (kg/m^3) to bulk unit weight (kN/m^3)."""
    return (kg_m3 * STANDARD_GRAVITY) / 1000.0


def normalize_unit_string(unit: str) -> str:
    """Clean and normalize unit string aliases."""
    u = unit.strip().lower()
    mapping = {
        "m": UNIT_METERS,
        "meter": UNIT_METERS,
        "meters": UNIT_METERS,
        "km": UNIT_KILOMETERS,
        "kilometer": UNIT_KILOMETERS,
        "kilometers": UNIT_KILOMETERS,
        "ft": UNIT_FEET,
        "feet": UNIT_FEET,
        "deg": UNIT_DEGREES,
        "degree": UNIT_DEGREES,
        "degrees": UNIT_DEGREES,
        "rad": UNIT_RADIANS,
        "radian": UNIT_RADIANS,
        "radians": UNIT_RADIANS,
        "mm": UNIT_MILLIMETERS,
        "millimeter": UNIT_MILLIMETERS,
        "millimeters": UNIT_MILLIMETERS,
        "mm/h": UNIT_MILLIMETERS_PER_HOUR,
        "mm/hr": UNIT_MILLIMETERS_PER_HOUR,
        "mm/hour": UNIT_MILLIMETERS_PER_HOUR,
        "mm/day": UNIT_MILLIMETERS_PER_DAY,
        "mm/24h": UNIT_MILLIMETERS_PER_DAY,
        "kpa": UNIT_KILOPASCALS,
        "pa": UNIT_PASCALS,
        "bar": UNIT_BAR,
        "kn/m3": UNIT_KN_PER_M3,
        "kn/m^3": UNIT_KN_PER_M3,
        "kg/m3": UNIT_KG_PER_M3,
        "kg/m^3": UNIT_KG_PER_M3,
    }
    return mapping.get(u, unit)


def convert_units(value: float, from_unit: str, to_unit: str) -> float:
    """Universal unit converter for supported engineering pairs."""
    u_from = normalize_unit_string(from_unit)
    u_to = normalize_unit_string(to_unit)

    if u_from == u_to:
        return value

    # Distance
    if u_from == UNIT_METERS and u_to == UNIT_KILOMETERS:
        return meters_to_km(value)
    if u_from == UNIT_KILOMETERS and u_to == UNIT_METERS:
        return km_to_meters(value)
    if u_from == UNIT_FEET and u_to == UNIT_METERS:
        return feet_to_meters(value)
    if u_from == UNIT_METERS and u_to == UNIT_FEET:
        return meters_to_feet(value)

    # Angle
    if u_from == UNIT_DEGREES and u_to == UNIT_RADIANS:
        return deg_to_rad(value)
    if u_from == UNIT_RADIANS and u_to == UNIT_DEGREES:
        return rad_to_deg(value)

    # Precipitation
    if u_from == UNIT_MILLIMETERS and u_to == UNIT_METERS:
        return mm_to_meters(value)
    if u_from == UNIT_METERS and u_to == UNIT_MILLIMETERS:
        return meters_to_mm(value)
    if u_from == UNIT_MILLIMETERS_PER_HOUR and u_to == UNIT_MILLIMETERS_PER_DAY:
        return hourly_rate_to_daily_accum(value)
    if u_from == UNIT_MILLIMETERS_PER_DAY and u_to == UNIT_MILLIMETERS_PER_HOUR:
        return daily_accum_to_avg_hourly_intensity(value)

    # Pressure
    if u_from == UNIT_KILOPASCALS and u_to == UNIT_PASCALS:
        return kpa_to_pa(value)
    if u_from == UNIT_PASCALS and u_to == UNIT_KILOPASCALS:
        return pa_to_kpa(value)
    if u_from == UNIT_BAR and u_to == UNIT_KILOPASCALS:
        return bar_to_kpa(value)

    # Density
    if u_from == UNIT_KN_PER_M3 and u_to == UNIT_KG_PER_M3:
        return kn_m3_to_kg_m3(value)
    if u_from == UNIT_KG_PER_M3 and u_to == UNIT_KN_PER_M3:
        return kg_m3_to_kn_m3(value)

    raise ValueError(f"Incompatible dimensional conversion from '{from_unit}' to '{to_unit}'")
