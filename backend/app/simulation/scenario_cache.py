"""Thread-Safe Scenario Caching for Rainfall What-If Simulation Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Caches repeated simulation queries to eliminate redundant ML inference and
geotechnical physics recalculations during interactive slider scrubbing.
"""
import hashlib
import json
import threading
from typing import Optional, Dict, Any
from collections import OrderedDict


class ScenarioCache:
    """Thread-safe LRU Cache for simulation runs."""

    def __init__(self, max_entries: int = 128):
        self._cache: OrderedDict[str, Any] = OrderedDict()
        self._max_entries = max_entries
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    @staticmethod
    def generate_key(
        rainfall_multiplier: float,
        additional_rainfall_mm: float,
        duration_hours: int,
        saturation_override: Optional[float] = None,
        model_version: str = "v1.2.0-gradient-boosting",
        location_count: int = 4
    ) -> str:
        """Create deterministic SHA256 cache key from scenario parameters."""
        canonical = {
            "m": round(float(rainfall_multiplier), 4),
            "add_mm": round(float(additional_rainfall_mm), 2),
            "d_hrs": int(duration_hours),
            "sat": round(float(saturation_override), 4) if saturation_override is not None else None,
            "model": str(model_version).strip(),
            "locs": int(location_count)
        }
        raw_bytes = json.dumps(canonical, sort_keys=True).encode("utf-8")
        return hashlib.sha256(raw_bytes).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Retrieve cached result or return None."""
        with self._lock:
            if key in self._cache:
                self._hits += 1
                self._cache.move_to_end(key)
                return self._cache[key]
            self._misses += 1
            return None

    def set(self, key: str, value: Any) -> None:
        """Store scenario result in cache with LRU eviction."""
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            else:
                if len(self._cache) >= self._max_entries:
                    self._cache.popitem(last=False)
            self._cache[key] = value

    def clear(self) -> None:
        """Evict all cached scenario entries."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """Return cache hit/miss statistics."""
        with self._lock:
            total = self._hits + self._misses
            hit_ratio = round(self._hits / total, 3) if total > 0 else 0.0
            return {
                "size": len(self._cache),
                "max_entries": self._max_entries,
                "hits": self._hits,
                "misses": self._misses,
                "hit_ratio": hit_ratio
            }


# Singleton scenario cache instance
scenario_cache = ScenarioCache(max_entries=128)
