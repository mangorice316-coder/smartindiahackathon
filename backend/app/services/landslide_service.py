"""Historical Landslide Inventory Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import HistoricalLandslide, Location


class LandslideService:
    """Service managing historical landslide events and scar inventories."""

    @staticmethod
    def list_historical_events(
        db: Session,
        location_id: Optional[int] = None,
        trigger_type: Optional[str] = None
    ) -> List[HistoricalLandslide]:
        query = db.query(HistoricalLandslide)
        if location_id:
            query = query.filter(HistoricalLandslide.location_id == location_id)
        if trigger_type:
            query = query.filter(HistoricalLandslide.trigger_type == trigger_type.upper())
        return query.order_by(HistoricalLandslide.event_date.desc()).all()

    @staticmethod
    def get_event_statistics(db: Session) -> Dict[str, Any]:
        """Aggregate metrics on historical landslide volume, triggers, and casualties."""
        events = db.query(HistoricalLandslide).all()
        total_casualties = sum(e.casualties or 0 for e in events)
        total_volume = sum(e.estimated_volume_m3 or 0 for e in events)

        triggers: Dict[str, int] = {}
        for e in events:
            triggers[e.trigger_type] = triggers.get(e.trigger_type, 0) + 1

        return {
            "total_recorded_events": len(events),
            "total_casualties": total_casualties,
            "total_estimated_volume_m3": round(total_volume, 1),
            "triggers_breakdown": triggers
        }
