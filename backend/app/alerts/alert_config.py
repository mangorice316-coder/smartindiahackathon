"""Configurable Alert Trigger Thresholds & Settings.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Provides runtime configurable parameters for early warning triggers,
avoiding hardcoded universal thresholds.
"""
from typing import Dict, Any
from dataclasses import dataclass, asdict


@dataclass
class AlertTriggerConfig:
    """Configurable parameters governing automated early warning alert generation."""
    critical_risk_score_threshold: float = 70.0
    high_risk_score_threshold: float = 50.0
    risk_surge_delta_threshold: float = 12.0          # % increase in risk score
    rapid_rainfall_intensity_threshold: float = 25.0  # mm/hour
    rainfall_24h_accumulation_threshold: float = 100.0 # mm / 24h
    rainfall_72h_accumulation_threshold: float = 200.0 # mm / 72h
    cooldown_window_minutes: int = 60                 # Minimum minutes before re-alerting unless escalated
    escalation_delta_threshold: float = 8.0           # Delta score jump that triggers immediate alert escalation

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Default Singleton Configuration
_current_config = AlertTriggerConfig()


def get_alert_config() -> AlertTriggerConfig:
    """Retrieve the active alert trigger configuration."""
    return _current_config


def update_alert_config(updates: Dict[str, Any]) -> AlertTriggerConfig:
    """Update active alert configuration parameters."""
    global _current_config
    current_data = _current_config.to_dict()
    for key, value in updates.items():
        if key in current_data and value is not None:
            setattr(_current_config, key, type(current_data[key])(value))
    return _current_config
