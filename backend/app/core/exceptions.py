"""Domain Exception Classes & Error Handlers.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Ensures failure modes are never silent and provide actionable diagnostic feedback.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base domain exception with message and HTTP status code."""
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class DataUnavailableError(DomainError):
    def __init__(self, message: str = "Requested geospatial or meteorological data is unavailable", details: dict = None):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE, details=details)


class APITimeoutError(DomainError):
    def __init__(self, message: str = "External meteorological data adapter timed out", details: dict = None):
        super().__init__(message, status_code=status.HTTP_504_GATEWAY_TIMEOUT, details=details)


class InvalidLocationError(DomainError):
    def __init__(self, message: str = "Target location ID or coordinates are invalid", details: dict = None):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND, details=details)


class ModelUnavailableError(DomainError):
    def __init__(self, message: str = "ML inference pipeline is uninitialized or artifact is missing", details: dict = None):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE, details=details)


class MissingFeatureError(DomainError):
    def __init__(self, message: str = "Mandatory geotechnical or terrain feature is missing for assessment", details: dict = None):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)


class InsufficientDataError(DomainError):
    def __init__(self, message: str = "Insufficient historical observations to compute statistical baseline", details: dict = None):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)


class PermissionDeniedError(DomainError):
    def __init__(self, message: str = "Insufficient role permissions to execute operational command", details: dict = None):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN, details=details)


class SimulationExecutionError(DomainError):
    def __init__(self, message: str = "Failed to complete scenario simulation run", details: dict = None):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)


async def domain_error_handler(request: Request, exc: DomainError):
    """Format domain errors as structured JSON responses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_type": exc.__class__.__name__,
            "message": exc.message,
            "status_code": exc.status_code,
            "path": request.url.path,
            "details": exc.details
        }
    )
