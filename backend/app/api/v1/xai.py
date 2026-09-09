"""Explainable AI (XAI) API Endpoints.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides transparent, model-grounded explanations for:
- Specific monitored catchment zones (GET /xai/location/{id})
- Arbitrary custom feature vectors (POST /xai/explain)
- Global model transparency, feature importances, and physical assumptions (GET /xai/transparency)
"""
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import (
    XAIExplanationResponse,
    XAIModelTransparencyResponse
)
from app.xai.explainer_service import LandslideXAIExplainer

router = APIRouter(prefix="/xai", tags=["Explainable AI (XAI)"])


class XAIExplainCustomRequest(BaseModel):
    features: Dict[str, Any]
    location_name: Optional[str] = "Custom Scenario"
    district: Optional[str] = "Western Ghats Region"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: int = 1500
    threatened_lifelines: Optional[List[str]] = None


@router.get("/location/{location_id}", response_model=XAIExplanationResponse)
def get_location_explanation(location_id: int, db: Session = Depends(get_db)):
    """Retrieve comprehensive dual-audience (analyst + community) explainability for a catchment."""
    try:
        explanation = LandslideXAIExplainer.explain_location(location_id=location_id, db=db)
        return explanation
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Explainability evaluation failed: {str(e)}")


@router.post("/explain", response_model=XAIExplanationResponse)
def explain_custom_features(request: XAIExplainCustomRequest):
    """Generate on-the-fly explainability analysis for an arbitrary feature vector."""
    try:
        explanation = LandslideXAIExplainer.explain_feature_vector(
            feature_dict=request.features,
            location_name=request.location_name,
            district=request.district,
            latitude=request.latitude,
            longitude=request.longitude,
            population=request.population,
            threatened_lifelines=request.threatened_lifelines
        )
        return explanation
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Feature explainability failed: {str(e)}")


@router.get("/transparency", response_model=XAIModelTransparencyResponse)
def get_model_transparency():
    """Retrieve model transparency report, evaluation metrics, feature importances, and physical assumptions."""
    try:
        return LandslideXAIExplainer.get_model_transparency()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load model transparency: {str(e)}")
