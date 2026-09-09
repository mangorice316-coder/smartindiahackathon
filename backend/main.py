"""Application Main Entrypoint.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Mission-Critical Decision Support System for Disaster Management.
"""
import uuid
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import init_db, SessionLocal
from app.api.v1.router import api_router
from app.data_adapters.demo_adapter import seed_demo_data
from app.ml.model_registry import initialize_or_load_default_model
from app.inspections.prioritizer import generate_prioritized_inspections
from app.security.integrity import register_integrity_guards
from app.security.safe_logging import configure_safe_logging
from app.security.rate_limiter import RateLimitMiddleware

logger = logging.getLogger("landslide_intelligence")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    # 1. Configure safe logging & credential scrubbers
    configure_safe_logging()

    # 2. Register ORM immutability & data integrity listeners
    register_integrity_guards()

    # 3. Production secret security assertion
    if settings.ENV == "production" and "super-secret" in settings.SECRET_KEY:
        logger.critical("SECURITY_ALERT: Default SECRET_KEY detected in production environment! Change immediately.")

    # 4. Initialize DB schema
    init_db()

    # 5. Seed database & register default ML model
    db = SessionLocal()
    try:
        seed_demo_data(db, force_reset=False)
        initialize_or_load_default_model(db)
        generate_prioritized_inspections(db)
    finally:
        db.close()

    yield
    # Shutdown events if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Mission-Critical Decision Support System for Landslide Risk Intelligence & Early Warning.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Rate Limiting Middleware (Sliding Window)
app.add_middleware(RateLimitMiddleware)

# CORS Middleware configuration (Restricted Origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    """System information and operational status banner."""
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "classification": "MISSION-CRITICAL DECISION SUPPORT PLATFORM",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "environment": settings.ENV,
        "strict_auth": settings.STRICT_AUTH,
        "disclaimer": "Probabilistic decision-support tool. Does not guarantee whether a landslide will or will not occur."
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Structured handler for request body and parameter validation errors."""
    request_id = str(uuid.uuid4())
    logger.warning(f"[{request_id}] Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "code": "REQUEST_VALIDATION_FAILED",
            "message": "Input validation failed. Please inspect field constraints.",
            "detail": exc.errors(),
            "details": exc.errors(),
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "path": request.url.path
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Structured handler for standard HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail if isinstance(exc.detail, str) else "HTTP Exception",
            "code": f"HTTP_{exc.status_code}",
            "message": str(exc.detail),
            "detail": exc.detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "path": request.url.path
        },
        headers=exc.headers
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global structured error handler preventing stack trace leakage to clients."""
    request_id = str(uuid.uuid4())
    logger.error(f"[{request_id}] Unhandled Exception on {request.method} {request.url.path}: {exc}", exc_info=True)

    # In development mode, provide error text for quick debugging; in production mask it completely
    msg = str(exc) if settings.ENV in ["development", "test"] else "An unexpected internal server error occurred. Please reference request_id."

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "code": "INTERNAL_SERVER_ERROR",
            "message": msg,
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "path": request.url.path
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
