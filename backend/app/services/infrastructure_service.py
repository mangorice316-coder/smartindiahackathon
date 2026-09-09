"""Critical Infrastructure & Lifeline Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Infrastructure, Location


class InfrastructureService:
    """Service managing critical physical assets and exposure calculations."""

    @staticmethod
    def list_infrastructure(
        db: Session,
        location_id: Optional[int] = None,
        asset_type: Optional[str] = None,
        lifeline_tier: Optional[int] = None
    ) -> List[Infrastructure]:
        query = db.query(Infrastructure)
        if location_id:
            query = query.filter(Infrastructure.location_id == location_id)
        if asset_type:
            query = query.filter(Infrastructure.asset_type == asset_type.upper())
        if lifeline_tier:
            query = query.filter(Infrastructure.lifeline_tier == lifeline_tier)
        return query.all()

    @staticmethod
    def get_infrastructure_summary(db: Session) -> Dict[str, Any]:
        """Aggregate counts of critical infrastructure by asset type and lifeline tier."""
        infras = db.query(Infrastructure).all()
        by_type: Dict[str, int] = {}
        tier_1_count = 0

        for item in infras:
            by_type[item.asset_type] = by_type.get(item.asset_type, 0) + 1
            if item.lifeline_tier == 1:
                tier_1_count += 1

        return {
            "total_assets": len(infras),
            "tier_1_critical_lifelines": tier_1_count,
            "by_type": by_type
        }
