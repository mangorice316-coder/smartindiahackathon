"""Mathematically Rigorous Model Evaluation Module.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Computes classification and probabilistic metrics suitable for imbalanced
landslide initiation modeling (ROC-AUC, PR-AUC, Brier score, Confusion Matrix,
and empirical calibration curves).
"""
import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    brier_score_loss
)
from sklearn.calibration import calibration_curve


def evaluate_model_performance(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    n_calibration_bins: int = 5
) -> Dict[str, Any]:
    """Compute comprehensive evaluation metrics for binary landslide risk classification."""
    y_true = np.asarray(y_true, dtype=int)
    y_pred = np.asarray(y_pred, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)

    # 1. Classical Classification Metrics
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    # 2. Discrimination Metrics (Ranking)
    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except ValueError:
        roc_auc = 0.5

    # PR-AUC is essential for rare-event hazard modeling
    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except ValueError:
        pr_auc = float(np.mean(y_true))

    # 3. Probability Calibration Metrics
    brier = float(brier_score_loss(y_true, y_prob))

    # Calibration curve points
    prob_true, prob_pred = calibration_curve(
        y_true, y_prob, n_bins=n_calibration_bins, strategy="uniform"
    )
    calibration_points = [
        {"predicted_bin": round(float(p), 4), "observed_frequency": round(float(o), 4)}
        for p, o in zip(prob_pred, prob_true)
    ]

    # 4. Confusion Matrix Breakdown
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = [int(x) for x in cm.ravel()]

    total = len(y_true)
    prevalence = float(np.mean(y_true))

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
            "total_samples": total
        },
        "landslide_prevalence": round(prevalence, 4),
        "calibration_curve": calibration_points
    }
