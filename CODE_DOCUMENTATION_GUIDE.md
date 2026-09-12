# LRIDS Inline Code Documentation Guide

Consistent, high-clarity code documentation standards for Python (FastAPI/Scikit-learn/SQLAlchemy) and TypeScript (React/Vite/Leaflet).

## 1. Python Standards (Google-Style Docstrings)

```python
def compute_factor_of_safety(
    slope_deg: float,
    cohesion_kpa: float,
    friction_angle_deg: float,
    soil_depth_m: float,
    pore_pressure_kpa: float,
    unit_weight_kn_m3: float = 19.5
) -> float:
    """Calculate the geotechnical Factor of Safety (Fs) using Mohr-Coulomb limit equilibrium.

    Applies the infinite slope failure equation:
        Fs = (c' + (gamma * z * cos^2(beta) - u) * tan(phi')) / (gamma * z * sin(beta) * cos(beta))

    Args:
        slope_deg: Topographic inclination in degrees (0.0 to 90.0).
        cohesion_kpa: Effective soil/rock cohesion in kiloPascals (c').
        friction_angle_deg: Internal friction angle in degrees (phi').
        soil_depth_m: Colluvium/saprolite depth to failure plane in meters (z).
        pore_pressure_kpa: Transient hydrostatic pore-water pressure in kiloPascals (u).
        unit_weight_kn_m3: Saturated soil unit weight in kN/m^3 (default 19.5).

    Returns:
        float: Factor of Safety (Fs). Values < 1.0 indicate imminent shear failure.

    Raises:
        ValueError: If slope_deg < 0 or > 90, or if soil_depth_m <= 0.
    """
    ...
```

## 2. TypeScript / React Standards (TSDoc)

```typescript
/**
 * Interactive Command & Control GIS canvas rendering risk zones, infrastructure,
 * and historical landslide scars.
 *
 * @param riskZonesGeoJSON - GeoJSON FeatureCollection of slope catchment polygons.
 * @param selectedLocationId - Currently focused zone ID in the operational viewport.
 * @param onSelectLocation - Callback triggered when an operator clicks an emergency sector.
 */
export const RiskMapCanvas: React.FC<RiskMapCanvasProps> = ({ ... }) => { ... };
```

## 3. Commenting Rules

- **Never restate syntax**: Avoid `// increment i by 1`.
- **Explain physical & operational constraints**: e.g., `# Cohesion decays by up to 50% under 100% saprolite saturation`.
- **Document public contracts**: Every REST router endpoint, Pydantic schema, and React component prop interface must have clear documentation.\n