"""Abstract Data Provider Interfaces.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Decouples external data sources (Real APIs vs Synthetic Demo Adapters).
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime


class WeatherDataProvider(ABC):
    """Abstract interface for meteorological and precipitation data ingestion."""

    @abstractmethod
    async def fetch_current_rainfall(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch current 1h intensity, 24h accumulation, and antecedent totals."""
        pass

    @abstractmethod
    async def fetch_forecast_rainfall(self, latitude: float, longitude: float, hours: int = 72) -> List[Dict[str, Any]]:
        """Fetch forward-looking rainfall forecast."""
        pass


class TerrainDataProvider(ABC):
    """Abstract interface for Digital Elevation Model (DEM) and topographic features."""

    @abstractmethod
    def get_terrain_derivatives(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return slope, aspect, curvature, and Topographic Wetness Index (TWI)."""
        pass


class SoilDataProvider(ABC):
    """Abstract interface for geotechnical and soil moisture properties."""

    @abstractmethod
    def get_soil_properties(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return cohesion, friction angle, hydraulic conductivity, and soil depth."""
        pass


class GeologyDataProvider(ABC):
    """Abstract interface for lithology, faults, and structural geology."""

    @abstractmethod
    def get_geology_features(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return lithology class, weathering grade, and fault proximity."""
        pass


class HistoricalLandslideProvider(ABC):
    """Abstract interface for historical landslide inventories."""

    @abstractmethod
    def get_historical_events(self, latitude: float, longitude: float, radius_km: float = 25.0) -> List[Dict[str, Any]]:
        """Return catalog of historical landslide scars within a radius."""
        pass


class InfrastructureDataProvider(ABC):
    """Abstract interface for critical infrastructure and lifeline assets."""

    @abstractmethod
    def get_infrastructure_assets(self, latitude: float, longitude: float, radius_km: float = 15.0) -> List[Dict[str, Any]]:
        """Return critical lifelines (roads, bridges, hospitals, schools, power)."""
        pass
