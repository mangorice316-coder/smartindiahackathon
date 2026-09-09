"""Field Inspection Prioritization Domain Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import InspectionTask
from app.inspections.prioritizer import generate_prioritized_inspections


class InspectionService:
    """Service managing multi-criteria field inspection prioritization and task dispatch."""

    @staticmethod
    def list_tasks(
        db: Session,
        urgency_tier: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[InspectionTask]:
        query = db.query(InspectionTask)
        if urgency_tier:
            query = query.filter(InspectionTask.urgency_tier == urgency_tier.upper())
        if status:
            query = query.filter(InspectionTask.status == status.upper())
        return query.order_by(InspectionTask.priority_score.desc()).all()

    @staticmethod
    def recalculate_priorities(db: Session) -> List[InspectionTask]:
        return generate_prioritized_inspections(db)

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        status: Optional[str] = None,
        assigned_team: Optional[str] = None,
        field_notes: Optional[str] = None
    ) -> InspectionTask:
        task = db.query(InspectionTask).filter(InspectionTask.id == task_id).first()
        if not task:
            raise ValueError(f"InspectionTask {task_id} not found.")

        if status:
            task.status = status.upper()
        if assigned_team:
            task.assigned_team = assigned_team
        if field_notes:
            task.field_notes = field_notes
        task.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(task)
        return task
