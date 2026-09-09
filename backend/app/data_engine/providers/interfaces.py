"""Domain-specific provider interfaces for landslide risk modeling.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Decouples all category-specific access logic from the risk scoring and physics engines.
"""
from abc import abstractmethod
from typing import Dict, Any, List, Optional
from app.data_engine.providers.base import BaseDataProvider


class RainfallProvider(BaseDataProvider):
    """Interface for meteorological rainfall and atmospheric moisture."""

    @abstractmethod
    async def fetch_current_rainfall(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch 1h intensity, 24h accumulation, and antecedent totals."""
        pass

    @abstractmethod
    async def fetch_hourly_series(self, latitude: float, longitude: float, hours: int = 168) -> List[Dict[str, Any]]:
        """Fetch historical hourly rainfall observations for rolling window calculation."""
        pass


class TerrainProvider(BaseDataProvider):
    """Interface for digital elevation and derived topographic derivatives."""

    @abstractmethod
    def get_elevation(self, latitude: float, longitude: float) -> float:
        """Return elevation in meters above sea level."""
        pass

    @abstractmethod
    def get_terrain_derivatives(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return slope (degrees), aspect (degrees), profile/plan curvature, and TWI."""
        pass

    @abstractmethod
    def get_elevation_grid(self, latitude: float, longitude: float, grid_size: int = 3, cell_size_m: float = 30.0) -> List[List[float]]:
        """Return a square elevation raster grid centered at coordinates."""
        pass


class SoilProvider(BaseDataProvider):
    """Interface for geotechnical soil mechanics and moisture content."""

    @abstractmethod
    def get_soil_properties(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return cohesion (kPa), friction angle (deg), Ksat (mm/h), depth (m), unit weight (kN/m3)."""
        pass


class LandCoverProvider(BaseDataProvider):
    """Interface for land use, vegetation indices, and human terrain modification."""

    @abstractmethod
    def get_land_cover(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return land cover class, NDVI vegetation index, tree canopy %, and road-cut distance."""
        pass


class GeologyProvider(BaseDataProvider):
    """Interface for lithology, tectonic fault lines, and structural discontinuities."""

    @abstractmethod
    def get_geology(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return lithology class, weathering grade, fault distance (m), and bedding dip (deg)."""
        pass


class HistoricalLandslideProvider(BaseDataProvider):
    """Interface for historical landslide scars inventory and catalog."""

    @abstractmethod
    def get_historical_scars(self, latitude: float, longitude: float, radius_km: float = 25.0) -> List[Dict[str, Any]]:
        """Return historical events with dates, severity, trigger mechanism, volume, and casualties."""
        pass


class InfrastructureProvider(BaseDataProvider):
    """Interface for critical lifelines, community assets, and exposure entities."""

    @abstractmethod
    def get_infrastructure_assets(self, latitude: float, longitude: float, radius_km: float = 15.0) -> List[Dict[str, Any]]:
        """Return list of villages, roads, bridges, schools, hospitals, and emergency facilities."""
        pass
