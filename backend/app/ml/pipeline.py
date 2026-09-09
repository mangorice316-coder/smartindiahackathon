"""Production Machine Learning Pipeline & Tabular Risk Estimator.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Features:
- Configurable feature vector schema
- Robust preprocessor with missing-data imputation & physical domain clipping
- Practical interpretable ensemble models: Random Forest & Gradient Boosting
- Mathematical evaluation: Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Brier score,
  Confusion Matrix, and empirical Calibration Curve
- Tree-path explainability (Saabas algorithm)
- Normalized 0-100 operational risk score with configurable category thresholds
- Batch prediction vectorization for GIS risk map generation
- Full artifact serialization (.joblib)
"""
import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime, timezone

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split

from app.config import settings
from app.ml.features import (
    FEATURE_SPECIFICATIONS,
    CORE_FEATURE_NAMES,
    REQUIRED_FEATURES,
    NUMERIC_FEATURES
)
from app.ml.preprocessing import LandslideFeaturePreprocessor
from app.ml.evaluation import evaluate_model_performance
from app.ml.explainability import explain_sample_prediction


def classify_risk_score_configurable(
    score: float,
    threshold_low: Optional[float] = None,
    threshold_mod: Optional[float] = None,
    threshold_high: Optional[float] = None
) -> str:
    """Classify numerical risk score [0, 100] into operational categories.
    
    Disclaimer: These thresholds are operational defaults and should be
    calibrated against validated regional field data.
    """
    t_low = threshold_low if threshold_low is not None else settings.THRESHOLD_LOW_MAX
    t_mod = threshold_mod if threshold_mod is not None else settings.THRESHOLD_MODERATE_MAX
    t_high = threshold_high if threshold_high is not None else settings.THRESHOLD_HIGH_MAX

    if score <= t_low:
        return "LOW"
    elif score <= t_mod:
        return "MODERATE"
    elif score <= t_high:
        return "HIGH"
    else:
        return "CRITICAL"


class LandslideMLPipeline:
    """Interpretable Tabular Landslide Risk Pipeline."""

    def __init__(self, algorithm: str = "RandomForest"):
        self.algorithm = algorithm
        self.preprocessor = LandslideFeaturePreprocessor()
        self.model = None
        self.is_trained = False
        self.version_tag = ""
        self.metrics: Dict[str, Any] = {}
        self.feature_importances: Dict[str, float] = {}
        self.is_demo: bool = True
        self.dataset_type: str = "DEMO DATASET"
        self.training_timestamp: Optional[datetime] = None

    def train_and_evaluate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        version_tag: str = "RF_LANDSLIDE_v2.0",
        is_demo: bool = True,
        dataset_type: str = "DEMO DATASET",
        hyperparameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Fit preprocessor, train ensemble model, evaluate metrics, and save state."""
        self.version_tag = version_tag
        self.is_demo = is_demo
        self.dataset_type = dataset_type
        self.training_timestamp = datetime.now(timezone.utc)

        # 1. Fit preprocessor and transform features
        X_clean, _ = self.preprocessor.fit_transform(X)

        # 2. Stratified train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_clean, y, test_size=0.25, random_state=42, stratify=y
        )

        params = hyperparameters or {}

        # 3. Instantiate model
        if self.algorithm == "GradientBoosting":
            n_est = int(params.get("n_estimators", 120))
            lr = float(params.get("learning_rate", 0.08))
            max_d = int(params.get("max_depth", 4))
            subsample = float(params.get("subsample", 0.85))
            self.model = GradientBoostingClassifier(
                n_estimators=n_est,
                learning_rate=lr,
                max_depth=max_d,
                subsample=subsample,
                random_state=42
            )
        else:
            self.algorithm = "RandomForest"
            n_est = int(params.get("n_estimators", 100))
            max_d = int(params.get("max_depth", 8))
            min_leaf = int(params.get("min_samples_leaf", 3))
            self.model = RandomForestClassifier(
                n_estimators=n_est,
                max_depth=max_d,
                min_samples_leaf=min_leaf,
                class_weight="balanced",
                random_state=42,
                n_jobs=1
            )

        # 4. Fit model
        self.model.fit(X_train, y_train)
        self.is_trained = True

        # 5. Holdout Evaluation
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]

        self.metrics = evaluate_model_performance(y_test.values, y_pred, y_prob)
        self.metrics["test_sample_count"] = len(y_test)
        self.metrics["total_samples"] = len(X)

        # 6. Global Feature Importances mapped back to primary features
        if hasattr(self.model, "feature_importances_"):
            raw_imp = self.model.feature_importances_
            feature_names = self.preprocessor.final_feature_names

            engineered_to_primary = {
                "aspect_sin": "aspect",
                "aspect_cos": "aspect",
                "rainfall_surge_ratio": "rainfall_1h",
                "antecedent_rain_ratio": "rainfall_3d",
                "slope_twi_interaction": "slope",
                "shear_stress_proxy": "slope"
            }

            agg_imp: Dict[str, float] = {k: 0.0 for k in CORE_FEATURE_NAMES}
            for feat, imp in zip(feature_names, raw_imp):
                # Remove categorical suffix
                primary = feat.split("__")[0]
                primary = engineered_to_primary.get(primary, primary)
                if primary in agg_imp:
                    agg_imp[primary] += float(imp)

            # Normalize to 1.0
            tot = sum(agg_imp.values()) or 1.0
            self.feature_importances = {
                k: round(v / tot, 4) for k, v in sorted(agg_imp.items(), key=lambda x: x[1], reverse=True)
            }
        else:
            self.feature_importances = {k: 0.0 for k in CORE_FEATURE_NAMES}

        return {
            "version_tag": self.version_tag,
            "algorithm": self.algorithm,
            "is_demo": self.is_demo,
            "dataset_type": self.dataset_type,
            "training_timestamp": self.training_timestamp.isoformat(),
            "metrics": self.metrics,
            "feature_importances": self.feature_importances,
            "hyperparameters": self.model.get_params()
        }

    def predict_risk(
        self,
        feature_dict: Dict[str, Any],
        data_timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate complete, standardized landslide risk prediction for a single record.
        
        Returns:
            risk_score: Normalized operational score [0, 100]
            risk_probability: P(Failure | Features) in [0.0, 1.0]
            risk_category: LOW, MODERATE, HIGH, CRITICAL
            model_version: Active version tag
            prediction_timestamp: UTC ISO timestamp
            data_timestamp: Ingestion/Observation timestamp
            feature_quality: Quality indicator & missing/clipped field report
            confidence: Confidence indicator in [0.0, 1.0]
            explanation: Tree-path explainability breakdown
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError("LandslideMLPipeline model is not trained. Train or load model before predict.")

        # 1. Convert to single-row DataFrame
        df_raw = pd.DataFrame([feature_dict])

        # 2. Transform with fitted preprocessor
        df_clean, quality_reports = self.preprocessor.transform(df_raw)
        quality_info = quality_reports[0] if quality_reports else {"status": "HEALTHY", "missing_count": 0}

        # 3. Model Inference (keeping DataFrame column names for sklearn)
        prob = float(self.model.predict_proba(df_clean)[0, 1])

        # 4. Operational Risk Score Normalization (0 - 100)
        risk_score = round(prob * 100.0, 1)

        # 5. Configurable Risk Category
        category = classify_risk_score_configurable(risk_score)

        # 6. Tree-path local explainability
        X_mat = df_clean.values
        explanation = explain_sample_prediction(
            model=self.model,
            X_processed_sample=X_mat[0],
            raw_feature_dict=feature_dict,
            feature_names=self.preprocessor.final_feature_names,
            top_k=5
        )

        # 7. Confidence estimation
        # Random Forest: measure inter-tree agreement (variance among tree probability votes)
        if isinstance(self.model, RandomForestClassifier):
            tree_votes = [t.predict_proba(X_mat)[0, 1] for t in self.model.estimators_]
            tree_variance = float(np.var(tree_votes))
            # Lower variance means higher consensus
            agreement_confidence = max(0.50, 1.0 - (tree_variance * 4.0))
        else:
            agreement_confidence = 0.85

        # Penalize confidence if critical features were imputed
        missing_penalty = min(0.35, quality_info.get("missing_count", 0) * 0.05)
        final_confidence = round(max(0.40, min(0.99, agreement_confidence - missing_penalty)), 2)

        now_utc = datetime.now(timezone.utc).isoformat()
        obs_time = data_timestamp.isoformat() if data_timestamp else now_utc

        return {
            "risk_score": risk_score,
            "risk_probability": round(prob, 4),
            "risk_category": category,
            "model_version": self.version_tag or "RF_LANDSLIDE_v2.0",
            "prediction_timestamp": now_utc,
            "data_timestamp": obs_time,
            "feature_quality": quality_info,
            "confidence": final_confidence,
            "explanation": explanation,
            "is_demo": self.is_demo,
            "disclaimer": "DEMO MODEL - NOT FOR REAL-WORLD DECISION MAKING" if self.is_demo else "OPERATIONAL VALIDATED MODEL"
        }

    def predict_batch(
        self,
        records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Vectorized high-throughput batch prediction for GIS risk grid cells."""
        if not self.is_trained or self.model is None:
            raise RuntimeError("LandslideMLPipeline model is not trained.")

        if not records:
            return []

        df_raw = pd.DataFrame(records)
        df_clean, quality_reports = self.preprocessor.transform(df_raw)

        probs = self.model.predict_proba(df_clean)[:, 1]
        now_utc = datetime.now(timezone.utc).isoformat()

        results = []
        for i, prob in enumerate(probs):
            score = round(float(prob) * 100.0, 1)
            cat = classify_risk_score_configurable(score)
            rec = records[i]

            results.append({
                "cell_id": rec.get("cell_id", rec.get("id", i)),
                "location_id": rec.get("location_id"),
                "latitude": rec.get("latitude", rec.get("lat")),
                "longitude": rec.get("longitude", rec.get("lon")),
                "risk_score": score,
                "risk_probability": round(float(prob), 4),
                "risk_category": cat,
                "quality_status": quality_reports[i]["status"] if i < len(quality_reports) else "HEALTHY",
                "model_version": self.version_tag
            })

        return results

    # Backward compatibility helpers for legacy callers
    def predict_probability(self, feature_dict: Dict[str, Any]) -> float:
        """Legacy helper for existing risk_engine.py."""
        res = self.predict_risk(feature_dict)
        return res["risk_probability"]

    def explain_prediction(self, feature_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Legacy helper returning top contributing factors for risk_engine.py."""
        res = self.predict_risk(feature_dict)
        exp = res["explanation"]
        top_factors = exp.get("top_risk_drivers", []) + exp.get("top_protective_factors", [])

        legacy_factors = []
        for f in top_factors[:5]:
            legacy_factors.append({
                "factor_name": f["factor_name"],
                "display_name": f["display_name"],
                "value": f["observed_value"],
                "unit": f["unit"],
                "contribution_score": f["relative_influence_pct"],
                "direction": f["direction"],
                "description": f["narrative"]
            })
        return legacy_factors

    def save_model(self, filepath: str) -> None:
        """Serialize complete pipeline, preprocessor state, and metadata to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        bundle = {
            "model": self.model,
            "algorithm": self.algorithm,
            "version_tag": self.version_tag,
            "metrics": self.metrics,
            "feature_importances": self.feature_importances,
            "preprocessor_config": self.preprocessor.get_config(),
            "is_demo": self.is_demo,
            "dataset_type": self.dataset_type,
            "training_timestamp": self.training_timestamp
        }
        joblib.dump(bundle, filepath)

    def load_model(self, filepath: str) -> None:
        """Load serialized pipeline bundle from disk."""
        data = joblib.load(filepath)
        self.model = data["model"]
        self.algorithm = data["algorithm"]
        self.version_tag = data["version_tag"]
        self.metrics = data.get("metrics", {})
        self.feature_importances = data.get("feature_importances", {})
        self.is_demo = data.get("is_demo", True)
        self.dataset_type = data.get("dataset_type", "DEMO DATASET")
        self.training_timestamp = data.get("training_timestamp")

        prep_config = data.get("preprocessor_config")
        if prep_config:
            self.preprocessor.load_config(prep_config)
        self.is_trained = True
