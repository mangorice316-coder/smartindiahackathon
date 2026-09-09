"""Geotechnical Infinite Slope Stability Physics Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Implements the deterministic planar infinite slope model with pore-water pressure.
"""
import math
from typing import Dict, Any, Tuple
from app.config import settings


def calculate_factor_of_safety(
    slope_degrees: float,
    cohesion_kpa: float,
    friction_angle_deg: float,
    soil_depth_m: float,
    bulk_density_kn_m3: float = 18.5,
    saturation_ratio_m: float = 0.0,
    water_density_kn_m3: float = settings.WATER_UNIT_WEIGHT_KN_M3
) -> Tuple[float, Dict[str, Any]]:
    """Calculate the geotechnical Factor of Safety (Fs) for an infinite slope.

    Fs = [ c' + (gamma - m * gamma_w) * z * cos^2(beta) * tan(phi') ]
         / [ gamma * z * sin(beta) * cos(beta) ]

    Parameters:
        slope_degrees (beta): Slope inclination in degrees.
        cohesion_kpa (c'): Effective soil cohesion in kPa (kN/m^2).
        friction_angle_deg (phi'): Effective angle of internal friction in degrees.
        soil_depth_m (z): Depth of regolith / slip plane in meters.
        bulk_density_kn_m3 (gamma): Total soil unit weight in kN/m^3.
        saturation_ratio_m (m): Ratio of water table height above slip plane to soil depth (0.0 - 1.0).
        water_density_kn_m3 (gamma_w): Unit weight of water (9.81 kN/m^3).

    Returns:
        Tuple of (Fs: float, breakdown: dict)
    """
    # Defensive checks: Planar infinite slope equilibrium is physically valid up to 65 degrees
    slope_deg = max(0.1, min(65.0, float(slope_degrees)))
    c_prime = max(0.0, float(cohesion_kpa))
    phi_deg = max(1.0, min(60.0, float(friction_angle_deg)))
    z = max(0.5, float(soil_depth_m))
    gamma = max(12.0, min(26.0, float(bulk_density_kn_m3)))
    m = max(0.0, min(1.0, float(saturation_ratio_m)))
    gamma_w = water_density_kn_m3

    # On near-flat plains (slope < 2 degrees), slope failure is physically negligible
    if slope_deg < 2.0:
        return 5.0, {
            "factor_of_safety": 5.0,
            "classification": "STABLE",
            "resisting_stress_kpa": 100.0,
            "driving_stress_kpa": 1.0,
            "cohesion_contribution_pct": 50.0,
            "friction_contribution_pct": 50.0,
            "pore_pressure_loss_pct": 0.0,
            "slope_degrees": slope_deg,
            "saturation_ratio": m,
            "note": "Slope angle < 2.0 deg: terrain is flat plain with zero gravitational shear hazard."
        }

    beta_rad = math.radians(slope_deg)
    phi_rad = math.radians(phi_deg)

    cos_beta = math.cos(beta_rad)
    sin_beta = math.sin(beta_rad)
    tan_phi = math.tan(phi_rad)

    # Driving shear stress along the slip plane (tau_d)
    # tau_d = gamma * z * sin(beta) * cos(beta)
    driving_stress = gamma * z * sin_beta * cos_beta

    if driving_stress <= 0.0001:
        return 5.0, {"factor_of_safety": 5.0, "classification": "STABLE"}

    # Resisting shear strength (tau_r)
    # Cohesion term: c'
    # Frictional term: (gamma - m * gamma_w) * z * cos^2(beta) * tan(phi')
    effective_normal_term = (gamma - (m * gamma_w)) * z * (cos_beta ** 2) * tan_phi
    resisting_stress = c_prime + max(0.0, effective_normal_term)

    fs = resisting_stress / driving_stress

    # Bound Fs to reasonable range for numeric stability
    fs = round(max(0.1, min(10.0, fs)), 3)

    # Stability classification
    if fs > settings.FS_STABLE_THRESHOLD:
        classification = "STABLE"
    elif fs >= settings.FS_CRITICAL_THRESHOLD:
        classification = "MARGINAL"
    else:
        classification = "UNSTABLE"

    # Percentage breakdown of resisting forces
    cohesion_pct = round((c_prime / resisting_stress) * 100.0, 1) if resisting_stress > 0 else 0.0
    friction_pct = round((effective_normal_term / resisting_stress) * 100.0, 1) if resisting_stress > 0 else 0.0

    # Theoretical maximum dry frictional strength vs current (pore-water pressure reduction)
    dry_frictional_term = gamma * z * (cos_beta ** 2) * tan_phi
    pore_loss_pct = round(max(0.0, (dry_frictional_term - effective_normal_term) / dry_frictional_term * 100.0), 1) if dry_frictional_term > 0 else 0.0

    breakdown = {
        "factor_of_safety": fs,
        "classification": classification,
        "resisting_stress_kpa": round(resisting_stress, 2),
        "driving_stress_kpa": round(driving_stress, 2),
        "cohesion_contribution_pct": cohesion_pct,
        "friction_contribution_pct": friction_pct,
        "pore_pressure_loss_pct": pore_loss_pct,
        "slope_degrees": slope_deg,
        "saturation_ratio": m,
        "soil_depth_m": z,
        "effective_cohesion_kpa": c_prime,
        "friction_angle_deg": phi_deg
    }

    return fs, breakdown


def fs_to_hazard_score(fs: float) -> float:
    """Convert geotechnical Factor of Safety to normalized hazard score [0, 100].

    Fs >= 1.50 -> Hazard = 0.0 (Strong mechanical stability)
    Fs = 1.00 -> Hazard = 62.5 (Threshold of failure equilibrium)
    Fs <= 0.70 -> Hazard = 100.0 (Extreme mechanical instability)
    """
    if fs >= 1.5:
        return 0.0
    if fs <= 0.7:
        return 100.0
    hazard = ((1.5 - fs) / (1.5 - 0.7)) * 100.0
    return round(max(0.0, min(100.0, hazard)), 2)
