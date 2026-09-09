"""Database Connection & Session Management.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.config import settings

# For SQLite, check_same_thread needs to be False for multithreading
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables and automatically migrate new columns."""
    import app.models.entities  # Ensure all models are imported before creating tables
    Base.metadata.create_all(bind=engine)

    # Auto-migrate newly added columns for SQLite compatibility without data loss
    if settings.DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        # Check alerts table
        if "alerts" in table_names:
            existing_cols = {col["name"] for col in inspector.get_columns("alerts")}
            alert_migrations = [
                ("alert_code", "VARCHAR(50)"),
                ("risk_category", "VARCHAR(50) DEFAULT 'HIGH'"),
                ("priority", "VARCHAR(50) DEFAULT 'HIGH'"),
                ("data_sources_json", "JSON"),
                ("model_version", "VARCHAR(100) DEFAULT 'v1.2.0-gradient-boosting'"),
                ("assigned_to", "VARCHAR(100)"),
                ("assigned_at", "DATETIME"),
                ("closed_at", "DATETIME"),
                ("escalation_count", "INTEGER DEFAULT 0"),
                ("last_escalated_at", "DATETIME"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in alert_migrations:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE alerts ADD COLUMN {col_name} {col_type}"))
                conn.commit()

        # Check inspection_tasks table
        if "inspection_tasks" in table_names:
            existing_cols = {col["name"] for col in inspector.get_columns("inspection_tasks")}
            inspection_migrations = [
                ("task_code", "VARCHAR(50)"),
                ("risk_score", "FLOAT DEFAULT 50.0"),
                ("assigned_officer", "VARCHAR(100)"),
                ("deadline", "DATETIME"),
                ("contributing_factors_json", "JSON"),
                ("affected_infrastructure_json", "JSON"),
                ("priority_breakdown_json", "JSON"),
                ("evidence_attachments_json", "JSON"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in inspection_migrations:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE inspection_tasks ADD COLUMN {col_name} {col_type}"))
                conn.commit()

        # Check historical_landslides table
        if "historical_landslides" in table_names:
            existing_cols = {col["name"] for col in inspector.get_columns("historical_landslides")}
            historical_migrations = [
                ("severity", "VARCHAR(50) DEFAULT 'MODERATE'"),
                ("data_source", "VARCHAR(100) DEFAULT 'GSI_BHUKOSH'"),
                ("affected_area_m2", "FLOAT"),
                ("rainfall_conditions_mm", "FLOAT"),
                ("nearby_infrastructure_json", "JSON"),
                ("data_confidence", "VARCHAR(50) DEFAULT 'HIGH'"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in historical_migrations:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE historical_landslides ADD COLUMN {col_name} {col_type}"))
                conn.commit()

        # Check model_versions table
        if "model_versions" in table_names:
            existing_cols = {col["name"] for col in inspector.get_columns("model_versions")}
            if "checksum_sha256" not in existing_cols:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE model_versions ADD COLUMN checksum_sha256 VARCHAR(64)"))
                    conn.commit()

