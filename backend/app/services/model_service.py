"""Machine Learning Model Governance Service.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import ModelVersion
from app.ml.model_registry import get_active_pipeline, initialize_or_load_default_model
from app.ml.pipeline import LandslideMLPipeline
from app.ml.synthetic_dataset import generate_synthetic_landslide_dataset
import datetime


class ModelService:
    """Service managing ML model lifecycle, evaluations, and retraining."""

    @staticmethod
    def get_active_model(db: Session) -> Optional[ModelVersion]:
        m = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
        if not m:
            initialize_or_load_default_model(db)
            m = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
        return m

    @staticmethod
    def list_models(db: Session) -> List[ModelVersion]:
        return db.query(ModelVersion).order_by(ModelVersion.training_timestamp.desc()).all()

    @staticmethod
    def retrain_model(db: Session, algorithm: str = "RandomForest", n_samples: int = 1500) -> ModelVersion:
        pipeline = LandslideMLPipeline(algorithm=algorithm)
        X, y = generate_synthetic_landslide_dataset(n_samples=n_samples, random_seed=42)
        tag = f"{algorithm[:2].upper()}_CALIB_{datetime.datetime.utcnow().strftime('%m%d_%H%M')}"
        eval_res = pipeline.train_and_evaluate(X, y, version_tag=tag)

        db.query(ModelVersion).update({ModelVersion.is_active: False})

        metrics = eval_res["metrics"]
        importances = eval_res["feature_importances"]

        new_model = ModelVersion(
            version_tag=tag,
            algorithm=algorithm,
            dataset_version=f"SYNTHETIC_CALIBRATED_{n_samples}",
            accuracy=metrics["accuracy"],
            f1_score=metrics["f1_score"],
            roc_auc=metrics["roc_auc"],
            sample_count=n_samples,
            hyperparameters_json=eval_res["hyperparameters"],
            feature_names_json=list(importances.keys()),
            feature_importances_json=importances,
            is_active=True,
            is_synthetic=True
        )
        db.add(new_model)
        db.commit()
        db.refresh(new_model)
        return new_model
