"""Configurable data freshness evaluation engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Evaluates data layers into:
- FRESH
- RECENT
- STALE
- UNAVAILABLE
Per user requirements: freshness rules are fully configurable per data category.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from app.data_engine.types import (
    DataCategory,
    FreshnessStatus,
    FreshnessConfig,
)


DEFAULT_CATEGORY_FRESHNESS = {
    DataCategory.RAINFALL: FreshnessConfig(
        fresh_threshold_seconds=3600,        # 1 hour
        recent_threshold_seconds=21600,      # 6 hours
        stale_threshold_seconds=86400        # 24 hours
    ),
    DataCategory.TERRAIN: FreshnessConfig(
        fresh_threshold_seconds=86400 * 30,   # 30 days
        recent_threshold_seconds=86400 * 180, # 6 months
        stale_threshold_seconds=86400 * 365   # 1 year
    ),
    DataCategory.SOIL: FreshnessConfig(
        fresh_threshold_seconds=86400 * 90,   # 90 days
        recent_threshold_seconds=86400 * 365, # 1 year
        stale_threshold_seconds=86400 * 730   # 2 years
    ),
    DataCategory.LAND_COVER: FreshnessConfig(
        fresh_threshold_seconds=86400 * 14,   # 14 days
        recent_threshold_seconds=86400 * 60,  # 60 days
        stale_threshold_seconds=86400 * 180   # 180 days
    ),
    DataCategory.GEOLOGY: FreshnessConfig(
        fresh_threshold_seconds=86400 * 365,  # 1 year
        recent_threshold_seconds=86400 * 730, # 2 years
        stale_threshold_seconds=86400 * 1825  # 5 years
    ),
    DataCategory.HISTORICAL_LANDSLIDES: FreshnessConfig(
        fresh_threshold_seconds=86400 * 30,   # 30 days
        recent_threshold_seconds=86400 * 90,  # 90 days
        stale_threshold_seconds=86400 * 365   # 1 year
    ),
    DataCategory.INFRASTRUCTURE: FreshnessConfig(
        fresh_threshold_seconds=86400 * 7,    # 7 days
        recent_threshold_seconds=86400 * 30,  # 30 days
        stale_threshold_seconds=86400 * 90    # 90 days
    ),
}


class FreshnessChecker:
    """Evaluator that checks observation age against configurable category thresholds."""

    def __init__(self, rules: Optional[Dict[DataCategory, FreshnessConfig]] = None):
        self.rules: Dict[DataCategory, FreshnessConfig] = dict(rules or DEFAULT_CATEGORY_FRESHNESS)

    def get_config(self, category: DataCategory) -> FreshnessConfig:
        return self.rules.get(category, FreshnessConfig())

    def update_config(self, category: DataCategory, fresh_sec: int, recent_sec: int, stale_sec: int):
        """Update category thresholds dynamically at runtime."""
        if not (fresh_sec < recent_sec < stale_sec):
            raise ValueError("Thresholds must satisfy fresh < recent < stale")
        self.rules[category] = FreshnessConfig(
            fresh_threshold_seconds=fresh_sec,
            recent_threshold_seconds=recent_sec,
            stale_threshold_seconds=stale_sec
        )

    def evaluate_freshness(
        self,
        observation_timestamp: Optional[datetime],
        category: DataCategory
    ) -> Tuple[FreshnessStatus, int, str]:
        """Determine freshness status based on elapsed seconds since measurement."""
        if observation_timestamp is None:
            return FreshnessStatus.UNAVAILABLE, -1, "No timestamp recorded"

        now_utc = datetime.now(timezone.utc)
        if observation_timestamp.tzinfo is None:
            observation_timestamp = observation_timestamp.replace(tzinfo=timezone.utc)

        age_seconds = max(0, int((now_utc - observation_timestamp).total_seconds()))
        config = self.get_config(category)

        if age_seconds <= config.fresh_threshold_seconds:
            status = FreshnessStatus.FRESH
            desc = f"Observed {age_seconds}s ago (under {config.fresh_threshold_seconds}s fresh limit)"
        elif age_seconds <= config.recent_threshold_seconds:
            status = FreshnessStatus.RECENT
            desc = f"Observed {age_seconds // 60}m ago (under {config.recent_threshold_seconds // 3600}h recent limit)"
        elif age_seconds <= config.stale_threshold_seconds:
            status = FreshnessStatus.STALE
            desc = f"Observed {age_seconds // 3600}h ago (under {config.stale_threshold_seconds // 86400}d stale limit)"
        else:
            status = FreshnessStatus.UNAVAILABLE
            desc = f"Observation is {age_seconds // 86400}d old, exceeding max stale limit"

        return status, age_seconds, desc
