"""Application Configuration & Configurable Risk Thresholds.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "AI-Powered Landslide Risk Intelligence & Early Warning System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Operating Mode
    ENV: str = Field(default="development", description="development | production | test")
    DATA_MODE: str = Field(default="DEMO", description="DEMO (synthetic marked data) | REAL (external adapters)")
    
    # Security & Authentication
    SECRET_KEY: str = Field(default="sih-landslide-intelligence-super-secret-key-change-in-prod-2026", description="JWT secret key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    STRICT_AUTH: bool = Field(default=False, description="Enforce strict JWT authentication on all guarded endpoints")
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "*"],
        description="Allowed CORS origins"
    )

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Enable API rate limiting")
    RATE_LIMIT_DEFAULT_RPM: int = Field(default=120, description="Default rate limit in requests per minute")
    RATE_LIMIT_AUTH_RPM: int = Field(default=15, description="Auth rate limit in requests per minute")
    RATE_LIMIT_SIMULATION_RPM: int = Field(default=30, description="Simulation rate limit in requests per minute")
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./landslide_risk.db",
        description="SQLAlchemy database connection URI (SQLite by default, PostgreSQL supported)"
    )
    
    # Configurable Risk Thresholds (0-100 scale)
    THRESHOLD_LOW_MAX: float = Field(default=30.0, description="Upper bound for LOW risk (0-30)")
    THRESHOLD_MODERATE_MAX: float = Field(default=50.0, description="Upper bound for MODERATE risk (31-50)")
    THRESHOLD_HIGH_MAX: float = Field(default=70.0, description="Upper bound for HIGH risk (51-70)")
    
    # Physics Engine Parameters
    WATER_UNIT_WEIGHT_KN_M3: float = 9.81  # gamma_w (kN/m^3)
    FS_STABLE_THRESHOLD: float = 1.3
    FS_CRITICAL_THRESHOLD: float = 1.0

    # Inspection Urgency Thresholds
    URGENCY_P1_IMMEDIATE: float = 80.0
    URGENCY_P2_HIGH: float = 60.0
    URGENCY_P3_MEDIUM: float = 40.0

    # Model Storage
    MODEL_ARTIFACTS_DIR: str = "./backend/model_artifacts"


settings = Settings()
