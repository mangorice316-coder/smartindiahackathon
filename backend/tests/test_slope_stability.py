"""Unit Tests for Geotechnical Slope Stability Physics Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
import pytest
from app.physics.slope_stability import calculate_factor_of_safety, fs_to_hazard_score


def test_infinite_slope_dry_stable():
    """Verify that a moderate slope in dry conditions has high Factor of Safety (> 1.3)."""
    fs, breakdown = calculate_factor_of_safety(
        slope_degrees=22.0,
        cohesion_kpa=20.0,
        friction_angle_deg=32.0,
        soil_depth_m=2.0,
        bulk_density_kn_m3=18.5,
        saturation_ratio_m=0.0 # Dry
    )
    assert fs > 1.3
    assert breakdown["classification"] == "STABLE"
    assert breakdown["pore_pressure_loss_pct"] == 0.0


def test_infinite_slope_saturated_failure():
    """Verify that a steep slope under full saturation triggers structural failure (Fs < 1.0)."""
    fs, breakdown = calculate_factor_of_safety(
        slope_degrees=42.0,
        cohesion_kpa=10.0,
        friction_angle_deg=26.0,
        soil_depth_m=2.5,
        bulk_density_kn_m3=18.5,
        saturation_ratio_m=0.95 # Saturated pore-water pressure
    )
    assert fs < 1.0
    assert breakdown["classification"] == "UNSTABLE"
    assert breakdown["pore_pressure_loss_pct"] > 30.0


def test_flat_plain_stability():
    """Verify that flat plains (slope < 2 deg) are unconditionally stable."""
    fs, breakdown = calculate_factor_of_safety(
        slope_degrees=1.0,
        cohesion_kpa=5.0,
        friction_angle_deg=20.0,
        soil_depth_m=2.0,
        saturation_ratio_m=1.0
    )
    assert fs >= 5.0
    assert breakdown["classification"] == "STABLE"


def test_fs_to_hazard_score():
    """Verify Factor of Safety to normalized hazard score mapping."""
    # Fs >= 1.5 -> Hazard = 0
    assert fs_to_hazard_score(1.6) == 0.0
    assert fs_to_hazard_score(1.5) == 0.0

    # Fs = 1.0 -> Equilibrium threshold -> around 62.5
    assert 60.0 <= fs_to_hazard_score(1.0) <= 65.0

    # Fs <= 0.7 -> Extreme failure hazard = 100
    assert fs_to_hazard_score(0.7) == 100.0
    assert fs_to_hazard_score(0.5) == 100.0
