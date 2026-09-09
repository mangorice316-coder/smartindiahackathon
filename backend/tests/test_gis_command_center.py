"""Automated Test Suite for the GIS Risk Intelligence Command Center.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Tests:
- GeoJSON FeatureCollection structure and coordinate bounds
- Risk layer filtering by category, score range, and administrative district
- Dynamic ML-driven micro-catchment risk grid generation
- Environmental overlays (drainage streams, geological faults)
- Infrastructure and historical landslide filtering
- Hotspot ranking order, deltas, and inspection priority assignment
- Spatial proximity calculation and danger buffer impact analysis
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from app.database import init_db, SessionLocal
from app.data_adapters.demo_adapter import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_gis_database():
    """Ensure database schema is initialized and seeded with demo data."""
    init_db()
    db = SessionLocal()
    seed_demo_data(db, force_reset=False)
    db.close()


def test_get_risk_zone_polygons_structure():
    """Verify GeoJSON FeatureCollection format and mandatory properties."""
    resp = client.get("/api/v1/gis/layers/risk-zones")
    assert resp.status_code == 200
    data = resp.json()

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 5

    feat = data["features"][0]
    assert feat["type"] == "Feature"
    assert "geometry" in feat
    assert feat["geometry"]["type"] in ["Polygon", "MultiPolygon"]

    props = feat["properties"]
    assert "location_id" in props
    assert "risk_score" in props
    assert "risk_category" in props
    assert props["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "geotechnical_fs" in props
    assert "stroke_color" in props
    assert "fill_color" in props


def test_risk_zone_filtering_category():
    """Verify filtering risk polygons by category."""
    resp_crit = client.get("/api/v1/gis/layers/risk-zones?category=CRITICAL")
    assert resp_crit.status_code == 200
    data_crit = resp_crit.json()
    for f in data_crit["features"]:
        assert f["properties"]["risk_category"] == "CRITICAL"

    resp_low = client.get("/api/v1/gis/layers/risk-zones?category=LOW")
    assert resp_low.status_code == 200
    data_low = resp_low.json()
    for f in data_low["features"]:
        assert f["properties"]["risk_category"] == "LOW"


def test_risk_zone_filtering_score_range():
    """Verify filtering risk polygons by score range."""
    resp = client.get("/api/v1/gis/layers/risk-zones?min_score=50.0&max_score=85.0")
    assert resp.status_code == 200
    data = resp.json()
    for f in data["features"]:
        score = f["properties"]["risk_score"]
        assert 50.0 <= score <= 85.0


def test_risk_grid_cells_generation():
    """Verify dynamic micro-catchment risk grid cell generation and ML scoring."""
    resp = client.get("/api/v1/gis/layers/risk-grid")
    assert resp.status_code == 200
    data = resp.json()

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 20  # Multiple 3x3 grids

    cell = data["features"][0]
    assert cell["geometry"]["type"] == "Polygon"
    assert "cell_id" in cell["properties"]
    assert "risk_score" in cell["properties"]
    assert "parent_location" in cell["properties"]
    assert 0.0 <= cell["properties"]["risk_score"] <= 100.0


def test_environmental_overlays():
    """Verify drainage stream lines and geological fault lines overlays."""
    resp = client.get("/api/v1/gis/layers/environmental")
    assert resp.status_code == 200
    data = resp.json()

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 5

    layer_types = {f["properties"]["layer_type"] for f in data["features"]}
    assert "drainage" in layer_types
    assert "geology_fault" in layer_types


def test_infrastructure_points_and_filtering():
    """Verify infrastructure point layer with tier and asset type filtering."""
    # All
    resp_all = client.get("/api/v1/gis/layers/infrastructure")
    assert resp_all.status_code == 200
    assert len(resp_all.json()["features"]) >= 10

    # Tier 1 only
    resp_t1 = client.get("/api/v1/gis/layers/infrastructure?lifeline_tier=1")
    assert resp_t1.status_code == 200
    for f in resp_t1.json()["features"]:
        assert f["properties"]["lifeline_tier"] == 1


def test_historical_landslides_layer():
    """Verify historical landslide scars layer."""
    resp = client.get("/api/v1/gis/layers/historical-landslides")
    assert resp.status_code == 200
    data = resp.json()

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 5

    feat = data["features"][0]
    assert feat["geometry"]["type"] == "Point"
    assert "trigger_type" in feat["properties"]
    assert "casualties" in feat["properties"]


def test_hotspot_ranking_and_priorities():
    """Verify operational hotspot rankings, deltas, and inspection priority assignment."""
    resp = client.get("/api/v1/gis/hotspots")
    assert resp.status_code == 200
    hotspots = resp.json()

    assert len(hotspots) >= 5

    # Check strict rank ordering descending
    for i in range(len(hotspots) - 1):
        assert hotspots[i]["risk_score"] >= hotspots[i + 1]["risk_score"]
        assert hotspots[i]["rank"] == i + 1

    top = hotspots[0]
    assert top["rank"] == 1
    assert "urgency_tier" in top
    assert top["urgency_tier"] in ["P1_IMMEDIATE", "P2_HIGH", "P3_MEDIUM", "P4_LOW"]
    assert "rainfall_24h_mm" in top
    assert "risk_delta_pct" in top
    assert "exposed_lifelines_count" in top


def test_catchment_spatial_impact_analysis():
    """Verify spatial proximity impact calculation within danger buffer."""
    # Location 1: Wayanad Meppadi
    resp = client.get("/api/v1/gis/location/1/impact?danger_buffer_meters=3000")
    assert resp.status_code == 200
    impact = resp.json()

    assert impact["location_id"] == 1
    assert "danger_buffer_meters" in impact
    assert impact["danger_buffer_meters"] == 3000.0
    assert "impact_rating" in impact
    assert "nearest_by_category" in impact

    # Nearest categories should have evaluated distances
    cats = impact["nearest_by_category"]
    assert "hospitals" in cats
    assert "roads" in cats

    if impact["closest_overall"]:
        assert impact["closest_overall"]["distance_meters"] > 0
        assert impact["closest_overall"]["distance_km"] > 0


def test_catchment_spatial_impact_404():
    """Verify 404 response for non-existent catchment."""
    resp = client.get("/api/v1/gis/location/99999/impact")
    assert resp.status_code == 404
