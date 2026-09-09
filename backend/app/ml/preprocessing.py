"""Reproducible Tabular Feature Preprocessor & Engineer.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Handles missing values, outlier clipping to physical bounds, categorical
one-hot encoding with unknown fallback, trigonometric aspect transformations,
and interaction ratios. Stores exact state configuration for model serialization.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from app.ml.features import (
    FEATURE_SPECIFICATIONS,
    CORE_FEATURE_NAMES,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    REQUIRED_FEATURES,
    FeatureType
)


class LandslideFeaturePreprocessor:
    """Production-grade tabular preprocessor and feature engineering pipeline."""

    def __init__(self):
        self.is_fitted: bool = False
        self.imputation_values: Dict[str, Any] = {}
        self.categorical_encoders: Dict[str, List[str]] = {}
        self.engineered_feature_names: List[str] = []
        self.final_feature_names: List[str] = []

    def fit(self, X: pd.DataFrame) -> "LandslideFeaturePreprocessor":
        """Compute imputation baselines and categorical levels from training data."""
        self.imputation_values = {}
        self.categorical_encoders = {}

        # 1. Numeric imputation baselines (median)
        for col in NUMERIC_FEATURES:
            spec = FEATURE_SPECIFICATIONS[col]
            if col in X.columns and not X[col].dropna().empty:
                val = float(X[col].median())
                # Clip to valid range if defined
                if spec.min_value is not None:
                    val = max(spec.min_value, val)
                if spec.max_value is not None:
                    val = min(spec.max_value, val)
                self.imputation_values[col] = round(val, 4)
            else:
                self.imputation_values[col] = float(spec.default_value)

        # 2. Categorical levels
        for col in CATEGORICAL_FEATURES:
            spec = FEATURE_SPECIFICATIONS[col]
            allowed = spec.allowed_categories or []
            if col in X.columns and not X[col].dropna().empty:
                observed = list(X[col].dropna().astype(str).unique())
                # Union of allowed and observed
                levels = sorted(list(set(allowed + observed)))
            else:
                levels = sorted(allowed)
            self.categorical_encoders[col] = levels

        self.is_fitted = True
        return self

    def transform(
        self,
        X: pd.DataFrame
    ) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """Transform raw input DataFrame into clean, engineered feature matrix.
        
        Returns:
            df_out: Clean numeric DataFrame ready for model estimators
            quality_reports: Per-row feature quality metadata
        """
        if not self.is_fitted:
            raise RuntimeError("LandslideFeaturePreprocessor must be fitted before transform.")

        df = X.copy()

        # Map legacy/interchangeable feature aliases
        aliases = {
            "slope_degrees": "slope",
            "rainfall_intensity_1h": "rainfall_1h",
            "rainfall_accum_24h": "rainfall_24h",
            "rainfall_antecedent_72h": "rainfall_3d",
            "soil_moisture_ratio": "soil_moisture",
            "ndvi_vegetation": "ndvi",
            "historical_event_density": "historical_landslide_density",
            "elevation_m": "elevation"
        }
        for old_k, new_k in aliases.items():
            if old_k in df.columns and new_k not in df.columns:
                df[new_k] = df[old_k]

        n_rows = len(df)
        quality_reports = []

        # 1. Validate required fields and collect quality telemetry per row
        for i in range(n_rows):
            row = df.iloc[i]
            imputed = []
            clipped = []

            for col, spec in FEATURE_SPECIFICATIONS.items():
                val = row.get(col, None)
                if val is None or pd.isna(val) or val == "":
                    imputed.append(col)
                elif spec.feature_type == FeatureType.NUMERIC:
                    try:
                        num_val = float(val)
                        if spec.min_value is not None and num_val < spec.min_value:
                            clipped.append(f"{col} < {spec.min_value}")
                        elif spec.max_value is not None and num_val > spec.max_value:
                            clipped.append(f"{col} > {spec.max_value}")
                    except (ValueError, TypeError):
                        imputed.append(col)

            status = "HEALTHY"
            if len(imputed) > 3 or len(clipped) > 2:
                status = "DEGRADED"
            elif len(imputed) > 0 or len(clipped) > 0:
                status = "IMPUTED_FIELDS"

            quality_reports.append({
                "status": status,
                "imputed_fields": imputed,
                "clipped_fields": clipped,
                "missing_count": len(imputed)
            })

        # 2. Impute and clip numeric features
        for col in NUMERIC_FEATURES:
            spec = FEATURE_SPECIFICATIONS[col]
            baseline = self.imputation_values.get(col, float(spec.default_value))

            if col not in df.columns:
                df[col] = baseline
            else:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(baseline)

            # Hard physical domain clipping
            if spec.min_value is not None or spec.max_value is not None:
                min_v = spec.min_value if spec.min_value is not None else -np.inf
                max_v = spec.max_value if spec.max_value is not None else np.inf
                df[col] = df[col].clip(lower=min_v, upper=max_v)

        # 3. Categorical encoding (One-Hot dummy columns)
        encoded_dfs = []
        for col in CATEGORICAL_FEATURES:
            spec = FEATURE_SPECIFICATIONS[col]
            levels = self.categorical_encoders.get(col, spec.allowed_categories or [])
            default_cat = spec.default_value

            if col not in df.columns:
                series = pd.Series([default_cat] * n_rows)
            else:
                series = df[col].fillna(default_cat).astype(str)

            for level in levels:
                dummy_col = f"{col}__{level}"
                dummy_series = (series == level).astype(float)
                encoded_dfs.append(pd.DataFrame({dummy_col: dummy_series}, index=df.index))

        # 4. Feature Engineering
        engineered = pd.DataFrame(index=df.index)

        # A. Trigonometric Aspect Decomposition (avoids 0°/360° north boundary issue)
        aspect_rad = np.radians(df["aspect"].values)
        engineered["aspect_sin"] = np.sin(aspect_rad)
        engineered["aspect_cos"] = np.cos(aspect_rad)

        # B. Rainfall Surge Ratio: 1h downpour intensity vs 24h average hourly rate
        hourly_avg = df["rainfall_24h"].values / 24.0 + 0.1
        engineered["rainfall_surge_ratio"] = np.clip(df["rainfall_1h"].values / hourly_avg, 0.0, 30.0)

        # C. Antecedent Saturation Ratio: 24h rain vs 3-day antecedent load
        engineered["antecedent_rain_ratio"] = np.clip(
            df["rainfall_24h"].values / (df["rainfall_3d"].values + 1.0),
            0.0,
            2.0
        )

        # D. Slope-Wetness Topographic Interaction
        slope_rad = np.radians(df["slope"].values)
        engineered["slope_twi_interaction"] = np.sin(slope_rad) * df["twi"].values

        # E. Geotechnical Shear Stress Proxy: gravitational driving force enhanced by moisture
        engineered["shear_stress_proxy"] = np.sin(slope_rad) * (1.0 + df["soil_moisture"].values)

        # Assemble final matrix in strict order
        final_parts = [df[NUMERIC_FEATURES]] + encoded_dfs + [engineered]
        df_final = pd.concat(final_parts, axis=1)

        if not self.final_feature_names:
            self.final_feature_names = list(df_final.columns)
            self.engineered_feature_names = list(engineered.columns)
        else:
            # Reorder columns to guarantee exact column alignment
            df_final = df_final.reindex(columns=self.final_feature_names, fill_value=0.0)

        return df_final, quality_reports

    def fit_transform(
        self,
        X: pd.DataFrame
    ) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """Fit preprocessor and transform dataset."""
        return self.fit(X).transform(X)

    def validate_single_input(self, raw_input: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Check for critical required features. Returns (is_valid, missing_or_invalid_fields)."""
        aliases = {
            "slope_degrees": "slope",
            "rainfall_intensity_1h": "rainfall_1h",
            "rainfall_accum_24h": "rainfall_24h",
            "rainfall_antecedent_72h": "rainfall_3d",
            "soil_moisture_ratio": "soil_moisture",
            "ndvi_vegetation": "ndvi",
            "historical_event_density": "historical_landslide_density",
            "elevation_m": "elevation"
        }
        resolved = dict(raw_input)
        for old_k, new_k in aliases.items():
            if old_k in resolved and new_k not in resolved:
                resolved[new_k] = resolved[old_k]

        missing_fields = []
        for req in REQUIRED_FEATURES:
            val = resolved.get(req)
            if val is None or pd.isna(val) or val == "":
                missing_fields.append(req)
        return len(missing_fields) == 0, missing_fields

    def get_config(self) -> Dict[str, Any]:
        """Export serialized configuration."""
        return {
            "is_fitted": self.is_fitted,
            "imputation_values": self.imputation_values,
            "categorical_encoders": self.categorical_encoders,
            "engineered_feature_names": self.engineered_feature_names,
            "final_feature_names": self.final_feature_names
        }

    def load_config(self, config: Dict[str, Any]) -> None:
        """Load serialized configuration."""
        self.is_fitted = config.get("is_fitted", True)
        self.imputation_values = config.get("imputation_values", {})
        self.categorical_encoders = config.get("categorical_encoders", {})
        self.engineered_feature_names = config.get("engineered_feature_names", [])
        self.final_feature_names = config.get("final_feature_names", [])
