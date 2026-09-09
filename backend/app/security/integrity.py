"""Data Integrity & ORM Immutability Guards.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Mechanically prevents unauthorized deletion, tampering, or mutation of
audit ledgers, historical disaster ground-truth, and model versions.
"""
import hashlib
import json
from typing import Dict, Any, List
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.models.entities import AuditEvent, HistoricalLandslide, ModelVersion, EnvironmentalObservation, Location


_guards_registered = False


def register_integrity_guards():
    """Register SQLAlchemy ORM listeners enforcing data integrity and immutability."""
    global _guards_registered
    if _guards_registered:
        return
    _guards_registered = True

    # 1. AuditEvent is append-only and strictly immutable
    @event.listens_for(AuditEvent, "before_delete")
    def prevent_audit_delete(mapper, connection, target):
        raise PermissionError("DATA_INTEGRITY_VIOLATION: Audit logs are append-only and cryptographically protected from deletion.")

    @event.listens_for(AuditEvent, "before_update")
    def prevent_audit_update(mapper, connection, target):
        raise PermissionError("DATA_INTEGRITY_VIOLATION: Audit logs are immutable and cannot be altered once recorded.")

    # 2. Historical landslide scar catalog is protected from arbitrary deletion
    @event.listens_for(HistoricalLandslide, "before_delete")
    def prevent_historical_delete(mapper, connection, target):
        raise PermissionError("DATA_INTEGRITY_VIOLATION: Historical landslide scar records are protected empirical observations and cannot be deleted.")

    # 3. ModelVersion parameters cannot be silently altered
    @event.listens_for(ModelVersion, "before_update")
    def prevent_model_tampering(mapper, connection, target):
        # We only allow toggling is_active; changing hyperparameters or version_tag is blocked
        # Note: SQLAlchemy state inspect can detect modified attributes
        from sqlalchemy.orm import attributes
        history_params = attributes.get_history(target, "hyperparameters_json")
        history_tag = attributes.get_history(target, "version_tag")
        history_features = attributes.get_history(target, "feature_names_json")
        history_accuracy = attributes.get_history(target, "accuracy")

        if history_params.has_changes() or history_tag.has_changes() or history_features.has_changes() or history_accuracy.has_changes():
            raise PermissionError("DATA_INTEGRITY_VIOLATION: Model version metadata, hyperparameters, and feature schemas are immutable once registered.")


def compute_model_checksum(
    hyperparameters: Union[Dict[str, Any], Any],
    feature_names: Optional[List[str]] = None,
    version_tag: Optional[str] = None
) -> str:
    """Generate SHA256 checksum for model metadata to detect silent tampering.
    
    Can be called with (model_version_instance) or (hyperparameters, feature_names, version_tag).
    """
    if hasattr(hyperparameters, "hyperparameters_json"):
        mv = hyperparameters
        params = mv.hyperparameters_json or {}
        features = mv.feature_names_json or []
        tag = mv.version_tag or ""
    else:
        params = hyperparameters or {}
        features = feature_names or []
        tag = version_tag or ""

    serialized = json.dumps({
        "tag": tag,
        "features": sorted(features),
        "params": params
    }, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def verify_baseline_unmodified(db: Session, baseline_snapshots: Dict[int, Dict[str, Any]]) -> bool:
    """Verify that current database records match initial pre-simulation baseline snapshots."""
    for loc_id, snap in baseline_snapshots.items():
        obs = db.query(EnvironmentalObservation).filter(
            EnvironmentalObservation.location_id == loc_id
        ).order_by(EnvironmentalObservation.timestamp.desc()).first()

        if obs:
            if abs(obs.soil_moisture_ratio - snap.get("soil_moisture_ratio", 0.0)) > 1e-6:
                return False
            if abs(obs.pore_water_pressure_kpa - snap.get("pore_water_pressure_kpa", 0.0)) > 1e-6:
                return False
    return True


# Auto-register integrity guards on import
register_integrity_guards()
