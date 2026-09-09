"""Alert & Early Warning Domain Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import Alert, Location
from app.alerts.alert_engine import evaluate_and_generate_alerts, acknowledge_alert


class AlertService:
    """Service managing CAP early warnings and operational lifecycle."""

    @staticmethod
    def list_alerts(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None
    ) -> List[Alert]:
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.status == status.upper())
        if severity:
            query = query.filter(Alert.severity == severity.upper())
        return query.order_by(Alert.timestamp.desc()).all()

    @staticmethod
    def acknowledge(db: Session, alert_id: int, user_name: str, action_notes: Optional[str] = None) -> Alert:
        return acknowledge_alert(db=db, alert_id=alert_id, user_name=user_name, action_notes=action_notes)

    @staticmethod
    def resolve(db: Session, alert_id: int, user_name: str = "OFFICER") -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert ID {alert_id} not found.")
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)
        return alert
