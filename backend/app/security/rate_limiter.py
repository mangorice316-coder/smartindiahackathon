"""In-Memory Sliding Window Rate Limiter Middleware.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Protects mission-critical inference, simulation, and authentication endpoints
from denial-of-service and credential-stuffing attacks.
"""
import time
import threading
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings


class InMemoryRateLimiter:
    """Thread-safe sliding window log rate limiter."""

    def __init__(self):
        self._lock = threading.Lock()
        # client_key -> list of timestamp floats
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, int]:
        """Check if request is allowed under the sliding window limit.

        Returns (is_allowed, remaining_quota, retry_after_seconds).
        """
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            # Purge timestamps older than sliding window
            timestamps = [t for t in self._history[client_key] if t > window_start]
            self._history[client_key] = timestamps

            current_count = len(timestamps)
            if current_count >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(window_seconds - (now - earliest)))
                return False, 0, retry_after

            # Record current request
            self._history[client_key].append(now)
            remaining = max_requests - current_count - 1
            return True, remaining, 0

    def reset(self):
        """Clear history (useful for automated testing)."""
        with self._lock:
            self._history.clear()


rate_limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware enforcing sliding-window rate limits per client IP."""

    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Exclude static documentation or root health ping
        path = request.url.path
        if path in ["/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Determine client identifier (prefer authorization header or client host)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            client_key = f"auth_{auth_header[:30]}"
        else:
            client_ip = request.client.host if request.client else "unknown"
            client_key = f"ip_{client_ip}"

        # Determine route-specific rate limits
        if "/auth/login" in path:
            limit = settings.RATE_LIMIT_AUTH_RPM
        elif "/simulation/run" in path:
            limit = settings.RATE_LIMIT_SIMULATION_RPM
        else:
            limit = settings.RATE_LIMIT_DEFAULT_RPM

        is_allowed, remaining, retry_after = rate_limiter.is_allowed(
            client_key=f"{client_key}:{path.split('/')[-1]}",
            max_requests=limit,
            window_seconds=60
        )

        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit of {limit} req/min exceeded. Please retry after {retry_after} seconds.",
                    "retry_after": retry_after,
                    "path": path
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0"
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
