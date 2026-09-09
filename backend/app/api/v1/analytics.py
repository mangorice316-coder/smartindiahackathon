"""Historical Landslide & Risk Analytics REST API Router.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.analytics.analytics_service import HistoricalAnalyticsService
from app.models.schemas import (
    AnalyticsSummaryResponse, SeasonalDataPoint, AnnualTrendDataPoint,
    RainfallEventPoint, RegionalComparisonItem, TimelineSnapshot,
    HistoricalLandslideDetailResponse
)

router = APIRouter(prefix="/analytics", tags=["Historical & Risk Analytics"])


def parse_optional_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string or YYYY-MM-DD string safely."""
    if not dt_str:
        return None
    try:
        if "T" in dt_str:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
        return datetime.strptime(dt_str, "%Y-%m-%d")
    except Exception:
        return None


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD or ISO)"),
    district: Optional[str] = Query(None, description="Filter by district name or 'ALL'"),
    severity: Optional[str] = Query(None, description="Filter by severity or 'ALL'"),
    data_source: Optional[str] = Query(None, description="Filter by data source or 'ALL'"),
    risk_category: Optional[str] = Query(None, description="Filter by risk category or 'ALL'"),
    db: Session = Depends(get_db)
):
    """Retrieve historical summary statistics and period-over-period comparison metrics."""
    s_dt = parse_optional_datetime(start_date)
    e_dt = parse_optional_datetime(end_date)
    return HistoricalAnalyticsService.get_analytics_summary(
        db=db,
        start_date=s_dt,
        end_date=e_dt,
        district=district,
        severity=severity,
        data_source=data_source,
        risk_category=risk_category
    )


@router.get("/seasonal", response_model=List[SeasonalDataPoint])
def get_seasonal_analysis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve monthly seasonal event frequency and average antecedent rainfall."""
    s_dt = parse_optional_datetime(start_date)
    e_dt = parse_optional_datetime(end_date)
    return HistoricalAnalyticsService.get_seasonal_analysis(
        db=db,
        start_date=s_dt,
        end_date=e_dt,
        district=district
    )


@router.get("/annual", response_model=List[AnnualTrendDataPoint])
def get_annual_trends(
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve annual historical landslide counts, severity distributions, and casualties."""
    return HistoricalAnalyticsService.get_annual_trends(db=db, district=district)


@router.get("/rainfall-events", response_model=List[RainfallEventPoint])
def get_rainfall_event_relationship(
    district: Optional[str] = Query(None),
    min_rainfall: float = Query(0.0, description="Minimum 24h rainfall threshold (mm)"),
    db: Session = Depends(get_db)
):
    """Retrieve paired observations of antecedent rainfall conditions vs landslide occurrences."""
    return HistoricalAnalyticsService.get_rainfall_event_relationship(
        db=db,
        district=district,
        min_rainfall=min_rainfall
    )


@router.get("/regional", response_model=List[RegionalComparisonItem])
def get_regional_comparison(
    db: Session = Depends(get_db)
):
    """Retrieve regional comparison matrix across monitored districts and states."""
    return HistoricalAnalyticsService.get_regional_comparison(db=db)


@router.get("/timeline-snapshots", response_model=List[TimelineSnapshot])
def get_timeline_snapshots(
    db: Session = Depends(get_db)
):
    """Retrieve chronological timeline snapshots of catchment risk statuses for map playback."""
    return HistoricalAnalyticsService.get_timeline_snapshots(db=db)


@router.get("/events/geojson")
def get_historical_events_geojson(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    data_source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve GeoJSON FeatureCollection of historical landslide scars and event points."""
    s_dt = parse_optional_datetime(start_date)
    e_dt = parse_optional_datetime(end_date)
    return HistoricalAnalyticsService.get_historical_events_geojson(
        db=db,
        start_date=s_dt,
        end_date=e_dt,
        district=district,
        severity=severity,
        data_source=data_source
    )


@router.get("/events")
def get_historical_events_paginated(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    data_source: Optional[str] = Query(None),
    search_query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve paginated, searchable table list of historical failure records."""
    s_dt = parse_optional_datetime(start_date)
    e_dt = parse_optional_datetime(end_date)
    return HistoricalAnalyticsService.get_historical_events_paginated(
        db=db,
        page=page,
        page_size=page_size,
        start_date=s_dt,
        end_date=e_dt,
        district=district,
        severity=severity,
        data_source=data_source,
        search_query=search_query
    )


@router.get("/events/{event_id}", response_model=HistoricalLandslideDetailResponse)
def get_historical_event_detail(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve detailed failure event dossier including nearby critical lifelines."""
    detail = HistoricalAnalyticsService.get_historical_event_detail(db=db, event_id=event_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historical landslide record with ID {event_id} not found."
        )
    return detail
