"""In-memory Time-To-Live (TTL) cache for environmental and geospatial queries.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Caches expensive terrain derivative, weather forecast, and proximity calculations.
Features thread safety, namespace invalidation, and hit/miss observability telemetry.
"""
import time
import threading
from typing import Dict, Any, Optional, Tuple


class TTLCache:
    """Thread-safe TTL cache with category namespaces and telemetry."""

    def __init__(self, default_ttl_seconds: int = 300):
        self._default_ttl = default_ttl_seconds
        self._store: Dict[str, Tuple[Any, float, str]] = {}  # key -> (value, expiry, category)
        self._lock = threading.Lock()
        self._hits: int = 0
        self._misses: int = 0
        self._evictions: int = 0

    def get(self, key: str) -> Optional[Any]:
        """Retrieve value if key exists and has not expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None

            val, expiry, _ = entry
            now = time.time()
            if now > expiry:
                del self._store[key]
                self._evictions += 1
                self._misses += 1
                return None

            self._hits += 1
            return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None, category: str = "DEFAULT"):
        """Store value with specified TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expiry = time.time() + ttl
        with self._lock:
            self._store[key] = (value, expiry, category)

    def invalidate(self, key: str) -> bool:
        """Explicitly purge a key from the cache."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def clear_category(self, category: str) -> int:
        """Purge all cached entries belonging to a category namespace."""
        with self._lock:
            to_remove = [k for k, (_, _, cat) in self._store.items() if cat == category]
            for k in to_remove:
                del self._store[k]
            return len(to_remove)

    def clear_all(self):
        """Purge entire cache storage."""
        with self._lock:
            self._store.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Return cache performance metrics."""
        with self._lock:
            now = time.time()
            active_count = sum(1 for _, expiry, _ in self._store.values() if expiry > now)
            total_requests = self._hits + self._misses
            hit_ratio = round((self._hits / total_requests) * 100.0, 1) if total_requests > 0 else 0.0

            return {
                "active_items": active_count,
                "total_stored": len(self._store),
                "hits": self._hits,
                "misses": self._misses,
                "hit_ratio_pct": hit_ratio,
                "evictions": self._evictions,
            }


# Global singleton instance for data engine
global_cache = TTLCache(default_ttl_seconds=300)
