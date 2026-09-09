"""Automated Test Suite: Historical Landslide and Risk Analytics Module.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Validates:
1. Server-side aggregations (monthly seasonal, annual trends, regional comparison)
2. Rainfall vs event threshold relationships
3. Period-over-period trend analysis and causation caveats
4. Chronological map timeline snapshots
5. Date, region, and severity filtering
6. Empty states handling (zero divide prevention)
7. FastAPI REST API endpoints
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from main import app
from app.data_adapters.demo_adapter import seed_demo_data
from app.analytics.analytics_service import HistoricalAnalyticsService
from app.models.entities import HistoricalLandslide, Location, RiskAssessment


# In-memory test database fixture
@pytest.fixture(scope="module")
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    seed_demo_data(db, force_reset=True)
    yield db
    db.close()


@pytest.fixture(scope="module")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_historical_analytics_summary_and_period_comparison(test_db):
    """Verify summary KPIs, category distributions, and period comparison."""
    summary = HistoricalAnalyticsService.get_analytics_summary(db=test_db)

    assert summary.total_cataloged_events >= 20
    assert summary.filtered_events_count == summary.total_cataloged_events
    assert summary.total_casualties > 0
    assert summary.total_debris_volume_m3 > 10000.0

    # Verify distributions have expected keys
    assert "CATASTROPHIC" in summary.severity_distribution
    assert "SEVERE" in summary.severity_distribution
    assert "MODERATE" in summary.severity_distribution

    # Verify period comparison metrics exist and have causation warning
    comp = summary.period_comparison
    assert comp.events_direction in ["INCREASED", "DECREASED", "UNCHANGED"]
    assert comp.risk_direction in ["INCREASED", "DECREASED", "UNCHANGED"]
    assert "correlation" in comp.scientific_causation_caveat.lower()
    assert "causation" in comp.scientific_causation_caveat.lower()


def test_seasonal_analysis_aggregation(test_db):
    """Verify monthly aggregation across all 12 calendar months and monsoon peak detection."""
    seasonal = HistoricalAnalyticsService.get_seasonal_analysis(db=test_db)

    assert len(seasonal) == 12
    # Verify months 1 to 12
    months = [s.month for s in seasonal]
    assert months == list(range(1, 13))

    # Verify monsoon surge months (July and August) have recorded failure events
    july_point = next(s for s in seasonal if s.month == 7)
    august_point = next(s for s in seasonal if s.month == 8)
    assert july_point.is_monsoon_peak is True
    assert august_point.is_monsoon_peak is True
    assert (july_point.event_count + august_point.event_count) > 0


def test_annual_trends_aggregation(test_db):
    """Verify multi-year annual trend aggregation from 2018 to current year."""
    trends = HistoricalAnalyticsService.get_annual_trends(db=test_db)

    assert len(trends) >= 7  # 2018 through 2024+
    years = [t.year for t in trends]
    assert 2018 in years
    assert 2024 in years

    # Check 2024 has recorded events
    trend_2024 = next(t for t in trends if t.year == 2024)
    assert trend_2024.event_count > 0
    assert (trend_2024.critical_events + trend_2024.severe_events + trend_2024.moderate_events) > 0


def test_rainfall_event_relationship(test_db):
    """Verify pairing of 24h precipitation conditions with failure events and threshold binning."""
    rf_points = HistoricalAnalyticsService.get_rainfall_event_relationship(db=test_db)

    assert len(rf_points) > 0
    for pt in rf_points:
        assert pt.rainfall_24h_mm >= 0.0
        assert pt.threshold_category in [
            "BELOW_THRESHOLD (<100mm)",
            "SURGE (100-150mm)",
            "INTENSE (150-200mm)",
            "DELUGE (>200mm)"
        ]

    # Deluge events (>200mm) should be present in the calibrated dataset
    deluge_events = [p for p in rf_points if ">200mm" in p.threshold_category]
    assert len(deluge_events) > 0


def test_regional_comparison_metrics(test_db):
    """Verify district-level regional grouping, average severity, and lifeline counts."""
    regional = HistoricalAnalyticsService.get_regional_comparison(db=test_db)

    assert len(regional) >= 4
    districts = [r.district for r in regional]
    assert "Wayanad" in districts
    assert "Idukki" in districts
    assert "Chamoli" in districts

    wayanad = next(r for r in regional if r.district == "Wayanad")
    assert wayanad.total_events > 0
    assert wayanad.critical_infrastructure_count > 0
    assert wayanad.avg_slope_degrees > 0.0


def test_timeline_snapshots_generation(test_db):
    """Verify chronological timeline snapshots generation for map playback."""
    snapshots = HistoricalAnalyticsService.get_timeline_snapshots(db=test_db)

    assert len(snapshots) == 6
    dates = [s.date for s in snapshots]
    # Check chronological ordering
    assert dates == sorted(dates)

    # Check first and last snapshots
    snap_2023 = snapshots[0]
    assert "2023" in snap_2023.date
    assert len(snap_2023.catchments) >= 5

    # Each catchment in the snapshot should have valid scores and categories
    for c in snap_2023.catchments:
        assert 0.0 <= c.risk_score <= 100.0
        assert c.risk_category in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert c.geotechnical_fs > 0.0


def test_date_and_severity_filtering(test_db):
    """Verify start_date, end_date, and severity filters filter correctly."""
    # Filter only year 2024
    start_2024 = datetime(2024, 1, 1)
    end_2024 = datetime(2024, 12, 31, 23, 59, 59)
    summary_2024 = HistoricalAnalyticsService.get_analytics_summary(
        db=test_db, start_date=start_2024, end_date=end_2024
    )
    assert summary_2024.filtered_events_count < summary_2024.total_cataloged_events
    assert summary_2024.filtered_events_count > 0

    # Filter only CATASTROPHIC severity
    summary_cat = HistoricalAnalyticsService.get_analytics_summary(
        db=test_db, severity="CATASTROPHIC"
    )
    assert summary_cat.filtered_events_count > 0
    assert summary_cat.filtered_events_count < summary_cat.total_cataloged_events


def test_empty_states_graceful_handling(test_db):
    """Verify zero division prevention and graceful handling of empty date ranges."""
    # Query future date where no events exist
    future_start = datetime(2035, 1, 1)
    future_end = datetime(2035, 12, 31)

    summary_empty = HistoricalAnalyticsService.get_analytics_summary(
        db=test_db, start_date=future_start, end_date=future_end
    )
    assert summary_empty.filtered_events_count == 0
    assert summary_empty.total_casualties == 0
    assert summary_empty.total_debris_volume_m3 == 0.0
    assert summary_empty.period_comparison.events_pct_change == 0.0

    seasonal_empty = HistoricalAnalyticsService.get_seasonal_analysis(
        db=test_db, start_date=future_start, end_date=future_end
    )
    assert len(seasonal_empty) == 12
    for s in seasonal_empty:
        assert s.event_count == 0

    rf_empty = HistoricalAnalyticsService.get_rainfall_event_relationship(
        db=test_db, min_rainfall=9999.0
    )
    assert len(rf_empty) == 0


def test_analytics_api_endpoints(client):
    """Verify all FastAPI REST endpoints under /api/v1/analytics return 200 OK with valid schemas."""
    # 1. Summary
    res = client.get("/api/v1/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_cataloged_events" in data
    assert "period_comparison" in data

    # 2. Seasonal
    res = client.get("/api/v1/analytics/seasonal")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 12

    # 3. Annual
    res = client.get("/api/v1/analytics/annual")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5

    # 4. Rainfall-Events
    res = client.get("/api/v1/analytics/rainfall-events")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0

    # 5. Regional
    res = client.get("/api/v1/analytics/regional")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4

    # 6. Timeline Snapshots
    res = client.get("/api/v1/analytics/timeline-snapshots")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 6

    # 7. GeoJSON
    res = client.get("/api/v1/analytics/events/geojson")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

    # 8. Events list paginated
    res = client.get("/api/v1/analytics/events?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) <= 10
    first_event_id = data["items"][0]["id"]

    # 9. Event detail
    res = client.get(f"/api/v1/analytics/events/{first_event_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == first_event_id
    assert "nearby_infrastructure" in detail
    assert "data_confidence" in detail

    # 10. Non-existent event returns 404
    res_404 = client.get("/api/v1/analytics/events/99999")
    assert res_404.status_code == 404
