"""Comprehensive test suite for Landslide Data Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Verifies:
- Unit conversion (m vs km, deg vs rad, mm vs m, hourly vs daily rates)
- Coordinate validation and CRS projection
- Rainfall rolling calculations (1h, 3h, 6h, 12h, 24h, 3d, 7d) and API
- Data normalization into CommonGeographicRecord
- Anomaly validation & spike detection without silent deletion
- Duplicate record detection
- Terrain derivative processing using Horn (1981) 3x3 DEM algorithm
- Geospatial Haversine proximity to critical lifelines
- Configurable data freshness evaluation
- In-memory TTL cache operations
- Synthetic DEMO dataset generation with explicit DEMO provenance
- Data Engine REST API endpoints
"""
import pytest
import math
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from main import app
from app.data_engine import (
    CommonGeographicRecord,
    DataCategory,
    DataQualityStatus,
    FreshnessStatus,
    DatasetType,
    convert_units,
    meters_to_km,
    km_to_meters,
    deg_to_rad,
    rad_to_deg,
    mm_to_meters,
    hourly_rate_to_daily_accum,
    daily_accum_to_avg_hourly_intensity,
    validate_coordinates,
    wgs84_to_web_mercator,
    web_mercator_to_wgs84,
    normalize_record,
    DataValidator,
    calculate_rolling_rainfall,
    calculate_slope_and_aspect_horn,
    haversine_distance_meters,
    calculate_infrastructure_proximity,
    FreshnessChecker,
    TTLCache,
    DemoDatasetGenerator,
)

client = TestClient(app)


# 1. UNIT CONVERSIONS
def test_unit_conversions():
    # Distance
    assert meters_to_km(1500.0) == 1.5
    assert km_to_meters(2.5) == 2500.0
    assert round(convert_units(100.0, "m", "km"), 4) == 0.1
    assert round(convert_units(3.28084, "ft", "m"), 2) == 1.0

    # Angle
    assert round(deg_to_rad(180.0), 4) == round(math.pi, 4)
    assert round(rad_to_deg(math.pi / 2.0), 1) == 90.0
    assert round(convert_units(45.0, "deg", "rad"), 4) == round(math.pi / 4.0, 4)

    # Precipitation
    assert mm_to_meters(1000.0) == 1.0
    assert convert_units(250.0, "mm", "m") == 0.25
    assert hourly_rate_to_daily_accum(10.0, duration_hours=24.0) == 240.0
    assert daily_accum_to_avg_hourly_intensity(120.0, hours=24.0) == 5.0
    assert convert_units(10.0, "mm/h", "mm/day") == 240.0
    assert convert_units(240.0, "mm/day", "mm/h") == 10.0

    # Pressure / Cohesion
    assert convert_units(15.0, "kPa", "Pa") == 15000.0
    assert convert_units(5000.0, "Pa", "kPa") == 5.0

    # Incompatible units error
    with pytest.raises(ValueError):
        convert_units(10.0, "deg", "mm")


# 2. COORDINATE VALIDATION & CRS
def test_coordinate_validation_and_crs():
    # Valid coordinates
    valid, err = validate_coordinates(11.5365, 76.1322)
    assert valid is True
    assert err is None

    # Invalid latitude
    valid, err = validate_coordinates(95.0, 76.0)
    assert valid is False
    assert "Latitude" in err

    # Invalid longitude
    valid, err = validate_coordinates(11.0, 195.0)
    assert valid is False
    assert "Longitude" in err

    # Non-numeric / NaN
    valid, err = validate_coordinates(float("nan"), 76.0)
    assert valid is False

    # WGS84 to Web Mercator roundtrip
    lat, lon = 11.5365, 76.1322
    x, y = wgs84_to_web_mercator(lat, lon)
    lat_rt, lon_rt = web_mercator_to_wgs84(x, y)
    assert round(lat_rt, 4) == round(lat, 4)
    assert round(lon_rt, 4) == round(lon, 4)


# 3. DATA NORMALIZATION
def test_data_normalization():
    raw = {
        "lat": 11.5365,
        "lon": 76.1322,
        "elevation": 3000.0,  # in feet
        "region": "Wayanad Hills",
        "slope_degrees": 35.5,
        "intensity_1h_mm": 25.0,
    }
    input_units = {"elevation": "ft", "slope_degrees": "deg"}

    record = normalize_record(
        raw_data=raw,
        category=DataCategory.TERRAIN,
        source_attribution="Field Geotech Station",
        dataset_type=DatasetType.DEMO,
        input_units=input_units
    )

    assert isinstance(record, CommonGeographicRecord)
    assert record.latitude == 11.5365
    assert record.longitude == 76.1322
    # 3000 feet converted to meters (~914.4 m)
    assert round(record.elevation_m, 1) == 914.4
    assert record.crs == "EPSG:4326"
    assert record.dataset_type == DatasetType.DEMO
    assert record.category == DataCategory.TERRAIN


# 4. ANOMALY VALIDATION WITHOUT SILENT DELETION
def test_data_validation_bounds_and_flags():
    validator = DataValidator()

    # Create record with out-of-range slope (115 degrees > 90) and negative rainfall
    raw = {
        "latitude": 11.5365,
        "longitude": 76.1322,
        "region": "Wayanad",
        "slope_degrees": 115.0,  # VIOLATION: >90 deg
        "intensity_1h_mm": -10.0, # VIOLATION: < 0 mm/h
    }
    record = normalize_record(raw, DataCategory.TERRAIN, "Test Station")
    res = validator.validate_record(record)

    # CRITICAL: Record was NOT deleted! Flags were captured and quality status set
    assert res.quality_status in (DataQualityStatus.OUT_OF_RANGE, DataQualityStatus.SUSPICIOUS)
    flag_codes = [f.code for f in res.flags]
    assert "OUT_OF_RANGE_VALUE" in flag_codes
    assert len(record.validation_flags) > 0


# 5. SPIKE DETECTION
def test_spike_detection():
    validator = DataValidator()

    rec1 = normalize_record(
        {"latitude": 11.53, "longitude": 76.13, "intensity_1h_mm": 10.0, "soil_moisture_ratio": 0.3},
        DataCategory.RAINFALL, "Station 1"
    )
    rec2_spike = normalize_record(
        {"latitude": 11.53, "longitude": 76.13, "intensity_1h_mm": 160.0, "soil_moisture_ratio": 0.85},
        DataCategory.RAINFALL, "Station 1"
    )

    res = validator.validate_record(rec2_spike, previous_record=rec1, check_duplicate=False)
    assert res.quality_status == DataQualityStatus.SPIKE
    flag_codes = [f.code for f in res.flags]
    assert "UNEXPECTED_RAINFALL_SPIKE" in flag_codes
    assert "UNEXPECTED_MOISTURE_JUMP" in flag_codes


# 6. DUPLICATE RECORD DETECTION
def test_duplicate_detection():
    validator = DataValidator()
    ts = datetime.now(timezone.utc)

    rec1 = normalize_record(
        {"latitude": 11.5365, "longitude": 76.1322, "intensity_1h_mm": 15.0, "accum_24h_mm": 50.0, "timestamp": ts.isoformat()},
        DataCategory.RAINFALL, "Station 1"
    )
    rec2 = normalize_record(
        {"latitude": 11.5365, "longitude": 76.1322, "intensity_1h_mm": 15.0, "accum_24h_mm": 50.0, "timestamp": ts.isoformat()},
        DataCategory.RAINFALL, "Station 1"
    )

    res1 = validator.validate_record(rec1, check_duplicate=True)
    res2 = validator.validate_record(rec2, check_duplicate=True)

    assert res1.quality_status == DataQualityStatus.HEALTHY
    assert res2.quality_status == DataQualityStatus.DUPLICATE
    assert any(f.code == "DUPLICATE_RECORD" for f in res2.flags)


# 7. RAINFALL ROLLING ACCUMULATION & API
def test_rainfall_rolling_windows():
    # 72 hours of constant 2.0 mm/h rainfall
    hourly = [{"timestamp": f"2026-09-09T{i % 24:02d}:00:00Z", "intensity_1h_mm": 2.0} for i in range(72)]
    rolling = calculate_rolling_rainfall(hourly)

    assert rolling["rainfall_1h"] == 2.0
    assert rolling["rainfall_3h"] == 6.0
    assert rolling["rainfall_6h"] == 12.0
    assert rolling["rainfall_12h"] == 24.0
    assert rolling["rainfall_24h"] == 48.0
    assert rolling["rainfall_3d"] == 144.0
    assert rolling["max_hourly_intensity"] == 2.0
    assert rolling["api_index"] > 0.0


# 8. TERRAIN HORN (1981) DERIVATIVE PROCESSING
def test_terrain_raster_processing_horn():
    # Flat horizontal plane: all elevations equal 500m
    flat_grid = [
        [500.0, 500.0, 500.0],
        [500.0, 500.0, 500.0],
        [500.0, 500.0, 500.0]
    ]
    res_flat = calculate_slope_and_aspect_horn(flat_grid, cell_size_m=30.0)
    assert res_flat["slope_degrees"] == 0.0
    assert res_flat["elevation_m"] == 500.0

    # East-rising inclined plane: z increases to the East (downslope facing West = 270 deg)
    tilted_grid = [
        [100.0, 130.0, 160.0],
        [100.0, 130.0, 160.0],
        [100.0, 130.0, 160.0]
    ]
    res_tilted = calculate_slope_and_aspect_horn(tilted_grid, cell_size_m=30.0)
    assert round(res_tilted["slope_degrees"], 1) == 45.0
    assert res_tilted["aspect_degrees"] == 270.0  # Downslope direction facing West


# 9. GEOSPATIAL PROXIMITY & LIFELINES
def test_geospatial_proximity_and_lifelines():
    origin_lat, origin_lon = 11.5365, 76.1322
    # Place a hospital ~200m away and a school ~1.5km away
    assets = [
        {"name": "Local PHC Clinic", "asset_type": "HOSPITAL", "latitude": 11.5380, "longitude": 76.1322, "lifeline_tier": 1},
        {"name": "Valley High School", "asset_type": "SCHOOL", "latitude": 11.5500, "longitude": 76.1322, "lifeline_tier": 2},
        {"name": "Stream Bridge", "asset_type": "BRIDGE", "latitude": 11.5360, "longitude": 76.1330, "lifeline_tier": 2},
    ]

    proximity = calculate_infrastructure_proximity(origin_lat, origin_lon, assets, danger_buffer_meters=500.0)
    assert proximity["total_assets_evaluated"] == 3
    assert proximity["nearest_by_category"]["HOSPITAL"] is not None
    assert proximity["nearest_by_category"]["SCHOOL"] is not None

    # Clinic is inside 500m danger buffer; School is outside
    exposed_names = [a["name"] for a in proximity["exposed_lifelines"]]
    assert "Local PHC Clinic" in exposed_names
    assert "Valley High School" not in exposed_names


# 10. CONFIGURABLE DATA FRESHNESS
def test_freshness_checker_and_configurable_rules():
    checker = FreshnessChecker()
    now = datetime.now(timezone.utc)

    # 15 minutes ago rainfall is FRESH
    ts_15m = now - timedelta(minutes=15)
    status, _, _ = checker.evaluate_freshness(ts_15m, DataCategory.RAINFALL)
    assert status == FreshnessStatus.FRESH

    # 3 hours ago rainfall is RECENT (threshold is 1h to 6h)
    ts_3h = now - timedelta(hours=3)
    status, _, _ = checker.evaluate_freshness(ts_3h, DataCategory.RAINFALL)
    assert status == FreshnessStatus.RECENT

    # 30 hours ago rainfall is UNAVAILABLE (> 24h)
    ts_30h = now - timedelta(hours=30)
    status, _, _ = checker.evaluate_freshness(ts_30h, DataCategory.RAINFALL)
    assert status == FreshnessStatus.UNAVAILABLE

    # Dynamic reconfiguration: make fresh threshold 4 hours
    checker.update_config(DataCategory.RAINFALL, fresh_sec=14400, recent_sec=43200, stale_sec=86400)
    status_reconfig, _, _ = checker.evaluate_freshness(ts_3h, DataCategory.RAINFALL)
    assert status_reconfig == FreshnessStatus.FRESH


# 11. TTL CACHE OPERATIONS
def test_ttl_cache_operations():
    cache = TTLCache(default_ttl_seconds=1)
    cache.set("key1", {"temp": 28.5}, ttl_seconds=2, category="WEATHER")

    # Hit
    assert cache.get("key1") == {"temp": 28.5}

    # Miss
    assert cache.get("nonexistent") is None

    stats = cache.get_stats()
    assert stats["hits"] >= 1
    assert stats["misses"] >= 1

    # Invalidation
    cache.invalidate("key1")
    assert cache.get("key1") is None


# 12. DEMO DATA GENERATOR
def test_demo_dataset_generator():
    gen = DemoDatasetGenerator(seed=777)
    scenario = gen.generate_full_catchment_scenario(
        name="Wayanad Test Basin",
        district="Wayanad",
        state="Kerala",
        base_lat=11.5365,
        base_lon=76.1322,
        terrain_type="STEEP_MONSOON"
    )

    # Must contain explicit DEMO metadata
    assert scenario["dataset_type"] == "DEMO"
    assert scenario["is_demo"] is True
    assert "disclaimer" in scenario

    # Check physical correlation
    assert scenario["terrain"]["slope_degrees"] >= 30.0
    assert scenario["rainfall"]["accum_24h_mm"] >= 100.0
    assert len(scenario["historical_landslides"]) >= 1
    assert len(scenario["infrastructure"]) >= 4


# 13. REST API ENDPOINTS
def test_data_engine_api_endpoints():
    # 1. Health
    res = client.get("/api/v1/data-engine/health")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_type"] == "DEMO"
    assert len(data["providers"]) >= 7

    # 2. Freshness Config GET & POST
    res_cfg = client.get("/api/v1/data-engine/freshness-config")
    assert res_cfg.status_code == 200

    payload_cfg = {
        "category": "RAINFALL",
        "fresh_threshold_seconds": 1800,
        "recent_threshold_seconds": 14400,
        "stale_threshold_seconds": 86400,
    }
    res_post_cfg = client.post("/api/v1/data-engine/freshness-config", json=payload_cfg)
    assert res_post_cfg.status_code == 200
    assert res_post_cfg.json()["status"] == "SUCCESS"

    # 3. Rolling Rainfall
    res_rain = client.get("/api/v1/data-engine/rainfall/rolling?latitude=11.5365&longitude=76.1322")
    assert res_rain.status_code == 200
    rain_data = res_rain.json()
    assert "rolling_accumulations" in rain_data
    assert "rainfall_24h" in rain_data["rolling_accumulations"]

    # 4. Horn Terrain Processing
    terrain_payload = {
        "grid": [
            [800.0, 820.0, 840.0],
            [800.0, 820.0, 840.0],
            [800.0, 820.0, 840.0]
        ],
        "cell_size_m": 30.0
    }
    res_terrain = client.post("/api/v1/data-engine/terrain/calculate", json=terrain_payload)
    assert res_terrain.status_code == 200
    assert "derivatives" in res_terrain.json()

    # 5. Infrastructure Proximity
    res_prox = client.get("/api/v1/data-engine/infrastructure/proximity?latitude=11.5365&longitude=76.1322")
    assert res_prox.status_code == 200
    assert "nearest_by_category" in res_prox.json()

    # 6. Validation & Flagging Endpoint
    val_payload = {
        "category": "TERRAIN",
        "source_attribution": "Field Station Alpha",
        "raw_data": {
            "latitude": 11.5365,
            "longitude": 76.1322,
            "slope_degrees": 34.5,
            "elevation_m": 880.0
        }
    }
    res_val = client.post("/api/v1/data-engine/validate", json=val_payload)
    assert res_val.status_code == 200
    assert res_val.json()["is_valid"] is True

    # 7. Cache Statistics
    res_cache = client.get("/api/v1/data-engine/cache/stats")
    assert res_cache.status_code == 200
    assert "hits" in res_cache.json()

    # 8. Demo Generation Endpoint
    res_demo = client.post("/api/v1/data-engine/demo/generate", json={"name": "Kallar Valley", "district": "Idukki"})
    assert res_demo.status_code == 200
    assert res_demo.json()["dataset_type"] == "DEMO"
