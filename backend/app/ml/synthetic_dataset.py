"""Synthetic Dataset Generator for Model Training & Calibration.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Generates physically consistent training samples modeled on Western Ghats
and Himalayan geotechnical regimes across 26 environmental features.

IMPORTANT: Clearly tagged as DEMO DATASET to prevent misrepresenting
simulated performance as empirical real-world validation.
"""
import numpy as np
import pandas as pd
from typing import Tuple, List
from app.physics.slope_stability import calculate_factor_of_safety
from app.ml.features import (
    FEATURE_SPECIFICATIONS,
    CORE_FEATURE_NAMES,
    FeatureType
)

# Export for backward compatibility with legacy tests
FEATURE_NAMES: List[str] = CORE_FEATURE_NAMES


def generate_synthetic_landslide_dataset(
    n_samples: int = 1600,
    random_seed: int = 42
) -> Tuple[pd.DataFrame, pd.Series]:
    """Generate high-fidelity synthetic geotechnical and meteorological dataset.

    Returns:
        X: DataFrame of 26 feature vectors matching FEATURE_SPECIFICATIONS
        y: Series of binary landslide initiation labels (0 = Stable, 1 = Failure)
    """
    np.random.seed(random_seed)

    # 1. Topography Features
    slope = np.random.beta(a=2.5, b=3.0, size=n_samples) * 55.0 + 5.0  # 5 to 60 deg
    elevation = np.random.uniform(200.0, 3200.0, size=n_samples)
    aspect = np.random.uniform(0.0, 360.0, size=n_samples)

    # 2. Meteorological & Hydrological Features (correlated temporal cascade)
    rain_1h = np.random.exponential(scale=12.0, size=n_samples).clip(0.0, 150.0)
    rain_3h = (rain_1h * 2.2 + np.random.exponential(scale=8.0, size=n_samples)).clip(0.0, 250.0)
    rain_6h = (rain_3h * 1.8 + np.random.exponential(scale=15.0, size=n_samples)).clip(0.0, 350.0)
    rain_12h = (rain_6h * 1.6 + np.random.exponential(scale=25.0, size=n_samples)).clip(0.0, 500.0)
    rain_24h = (rain_12h * 1.5 + np.random.exponential(scale=40.0, size=n_samples)).clip(0.0, 750.0)
    rain_3d = (rain_24h * 1.8 + np.random.exponential(scale=60.0, size=n_samples)).clip(0.0, 1200.0)
    rain_7d = (rain_3d * 1.6 + np.random.exponential(scale=90.0, size=n_samples)).clip(0.0, 2000.0)

    # Soil moisture correlates with 72h antecedent rainfall
    moisture = (0.22 + 0.68 * (rain_3d / 800.0) + np.random.normal(0, 0.04, n_samples)).clip(0.12, 0.98)

    # 3. Geotechnical Soil Properties
    cohesion = np.random.uniform(8.0, 35.0, size=n_samples)  # kPa
    friction_angle = np.random.uniform(22.0, 38.0, size=n_samples)  # deg
    soil_depth = np.random.uniform(1.2, 4.0, size=n_samples)  # m
    permeability = 10 ** np.random.uniform(-7.0, -3.5, size=n_samples)  # m/s

    # 4. Land Cover & Vegetation
    land_cover_options = [
        "evergreen_forest", "deciduous_forest", "agriculture_plantation",
        "barren_rock", "settlement_urban", "shrubland", "tea_estate"
    ]
    land_cover_probs = [0.25, 0.20, 0.20, 0.08, 0.07, 0.10, 0.10]
    land_cover = np.random.choice(land_cover_options, size=n_samples, p=land_cover_probs)

    ndvi = np.random.beta(a=3.0, b=2.0, size=n_samples).clip(0.05, 0.92)
    canopy = (ndvi * 90.0 + np.random.normal(0, 8.0, size=n_samples)).clip(5.0, 98.0)

    # 5. Drainage & Wetness
    twi = np.random.normal(loc=7.5, scale=2.2, size=n_samples).clip(3.0, 16.0)
    drainage_density = np.random.uniform(0.5, 6.0, size=n_samples)
    dist_stream = np.random.exponential(scale=350.0, size=n_samples).clip(15.0, 3500.0)

    # 6. Geological Characteristics
    lithologies = ["gneiss_schist", "sandstone_shale", "granite", "basalt", "limestone", "alluvium"]
    litho_probs = [0.35, 0.25, 0.18, 0.10, 0.07, 0.05]
    lithology = np.random.choice(lithologies, size=n_samples, p=litho_probs)

    weathering_grades = ["fresh", "slightly_weathered", "moderately_weathered", "highly_weathered", "completely_weathered", "residual_soil"]
    weather_probs = [0.10, 0.18, 0.32, 0.22, 0.12, 0.06]
    weathering = np.random.choice(weathering_grades, size=n_samples, p=weather_probs)

    fault_dist = np.random.exponential(scale=2800.0, size=n_samples).clip(50.0, 45000.0)
    bedding_dip = np.random.uniform(5.0, 75.0, size=n_samples)

    # 7. Historical & Spatial Memory
    hist_density = np.random.poisson(lam=2.0, size=n_samples).clip(0, 18)
    dist_prev = np.random.exponential(scale=900.0, size=n_samples).clip(20.0, 20000.0)

    # Physics-grounded labeling via Mohr-Coulomb Infinite Slope limit equilibrium
    labels = []
    for i in range(n_samples):
        # Forest root cohesion bonus
        root_cohesion = 4.5 if "forest" in land_cover[i] else (2.0 if "estate" in land_cover[i] else 0.5)

        fs, _ = calculate_factor_of_safety(
            slope_degrees=slope[i],
            cohesion_kpa=cohesion[i] + root_cohesion,
            friction_angle_deg=friction_angle[i],
            soil_depth_m=soil_depth[i],
            saturation_ratio_m=moisture[i]
        )

        # Empirical Rainfall Trigger: Caine (1980) & Geological Survey of India empirical envelope
        rainfall_trigger = (
            (rain_24h[i] > 140.0 and slope[i] > 22.0) or
            (rain_3d[i] > 260.0 and slope[i] > 18.0) or
            (rain_1h[i] > 45.0 and slope[i] > 26.0)
        )
        geological_trigger = (
            weathering[i] in ["highly_weathered", "completely_weathered", "residual_soil"] and
            fault_dist[i] < 600.0 and slope[i] > 25.0
        )
        stream_erosion_trigger = (dist_stream[i] < 45.0 and slope[i] > 30.0 and rain_24h[i] > 80.0)

        # Latent failure probability
        if fs < 0.95 or (fs < 1.15 and rainfall_trigger) or geological_trigger or stream_erosion_trigger:
            prob = 0.88 + 0.12 * (1.0 - min(1.0, fs))
        elif fs < 1.30 and (rain_24h[i] > 90.0 or hist_density[i] >= 3):
            prob = 0.50
        elif fs < 1.50 and rain_3d[i] > 180.0:
            prob = 0.25
        else:
            prob = 0.04

        label = 1 if np.random.rand() < prob else 0
        labels.append(label)

    data = {
        "rainfall_1h": np.round(rain_1h, 2),
        "rainfall_3h": np.round(rain_3h, 2),
        "rainfall_6h": np.round(rain_6h, 2),
        "rainfall_12h": np.round(rain_12h, 2),
        "rainfall_24h": np.round(rain_24h, 2),
        "rainfall_3d": np.round(rain_3d, 2),
        "rainfall_7d": np.round(rain_7d, 2),
        "soil_moisture": np.round(moisture, 3),
        "elevation": np.round(elevation, 1),
        "slope": np.round(slope, 2),
        "aspect": np.round(aspect, 1),
        "soil_cohesion_kpa": np.round(cohesion, 2),
        "soil_friction_angle_deg": np.round(friction_angle, 2),
        "soil_depth_m": np.round(soil_depth, 2),
        "soil_permeability_m_s": permeability,
        "land_cover": land_cover,
        "ndvi": np.round(ndvi, 3),
        "tree_canopy_pct": np.round(canopy, 1),
        "drainage_density_km_km2": np.round(drainage_density, 2),
        "distance_to_stream_m": np.round(dist_stream, 1),
        "twi": np.round(twi, 2),
        "lithology": lithology,
        "weathering_grade": weathering,
        "fault_distance_m": np.round(fault_dist, 1),
        "bedding_dip_deg": np.round(bedding_dip, 1),
        "historical_landslide_density": hist_density,
        "distance_to_previous_landslide": np.round(dist_prev, 1),
    }

    df = pd.DataFrame(data)
    y = pd.Series(labels, name="landslide_occurrence")
    return df, y
