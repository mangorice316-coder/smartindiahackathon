"""Base Data Provider abstract base class.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Every provider must implement:
- fetch
- validate
- normalize
- metadata
- timestamp
- source attribution
- quality status
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.data_engine.types import (
    CommonGeographicRecord,
    DataCategory,
    DataQualityStatus,
    DatasetType,
    ProviderMetadata,
    ValidationResult,
)
from app.data_engine.normalization.normalizer import normalize_record
from app.data_engine.validation.validator import DataValidator


class BaseDataProvider(ABC):
    """Abstract interface governing all environmental and geospatial data providers."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.validator = validator or DataValidator()
        self._last_timestamp: datetime = datetime.now(timezone.utc)
        self._quality_status: DataQualityStatus = DataQualityStatus.HEALTHY

    @abstractmethod
    def get_metadata(self) -> ProviderMetadata:
        """Return provider identification, licensing, and update telemetry."""
        pass

    @abstractmethod
    async def fetch(self, latitude: float, longitude: float, **kwargs) -> Dict[str, Any]:
        """Acquire raw observation data from the underlying remote API or synthetic registry."""
        pass

    def normalize(self, raw_data: Dict[str, Any], input_units: Optional[Dict[str, str]] = None) -> CommonGeographicRecord:
        """Transform raw provider dictionary into standardized CommonGeographicRecord."""
        meta = self.get_metadata()
        dataset_type = DatasetType.DEMO if meta.is_demo else DatasetType.REAL
        return normalize_record(
            raw_data=raw_data,
            category=meta.category,
            source_attribution=meta.source_attribution,
            dataset_type=dataset_type,
            input_units=input_units
        )

    def validate(self, record: CommonGeographicRecord) -> ValidationResult:
        """Validate CommonGeographicRecord and update provider's internal health status."""
        result = self.validator.validate_record(record)
        self._quality_status = result.quality_status
        self._last_timestamp = record.timestamp
        return result

    def get_timestamp(self) -> datetime:
        """Return UTC timestamp of the most recent observation handled."""
        return self._last_timestamp

    def get_source_attribution(self) -> str:
        """Return formal legal attribution for citations and data provenance."""
        return self.get_metadata().source_attribution

    def get_quality_status(self) -> DataQualityStatus:
        """Return current operational quality indicator."""
        return self._quality_status
