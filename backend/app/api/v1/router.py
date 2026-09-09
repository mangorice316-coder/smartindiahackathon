"""API v1 Router Aggregator.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.overview import router as overview_router
from app.api.v1.locations import router as locations_router
from app.api.v1.gis import router as gis_router
from app.api.v1.risk import router as risk_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.inspections import router as inspections_router
from app.api.v1.weather import router as weather_router
from app.api.v1.ml import router as ml_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit import router as audit_router
from app.api.v1.health import router as health_router
from app.api.v1.data_engine import router as data_engine_router
from app.api.v1.xai import router as xai_router
from app.api.v1.analytics import router as analytics_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(overview_router)
api_router.include_router(locations_router)
api_router.include_router(gis_router)
api_router.include_router(risk_router)
api_router.include_router(simulation_router)
api_router.include_router(alerts_router)
api_router.include_router(inspections_router)
api_router.include_router(weather_router)
api_router.include_router(ml_router)
api_router.include_router(reports_router)
api_router.include_router(audit_router)
api_router.include_router(health_router)
api_router.include_router(data_engine_router)
api_router.include_router(xai_router)
api_router.include_router(analytics_router)


