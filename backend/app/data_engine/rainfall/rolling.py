"""Rolling rainfall accumulation and antecedent precipitation index engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Computes configurable rolling windows:
- rainfall_1h
- rainfall_3h
- rainfall_6h
- rainfall_12h
- rainfall_24h
- rainfall_3d (72h)
- rainfall_7d (168h)
and Antecedent Precipitation Index (API).
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import math


DEFAULT_ROLLING_WINDOWS = {
    "rainfall_1h": 1,
    "rainfall_3h": 3,
    "rainfall_6h": 6,
    "rainfall_12h": 12,
    "rainfall_24h": 24,
    "rainfall_3d": 72,
    "rainfall_7d": 168,
}


def calculate_rolling_rainfall(
    hourly_series: List[Dict[str, Any]],
    windows: Optional[Dict[str, int]] = None,
    api_decay_factor: float = 0.85
) -> Dict[str, Any]:
    """Calculate rolling precipitation totals across specified multi-hour windows.

    Args:
        hourly_series: List of dicts with 'timestamp' and 'intensity_1h_mm' or 'rainfall_mm'
        windows: Mapping of window identifier to duration in hours
        api_decay_factor: Daily decay factor k for Antecedent Precipitation Index (default 0.85)

    Returns:
        Dictionary containing rolling accumulations, max intensity, and API index.
    """
    windows = windows or DEFAULT_ROLLING_WINDOWS
    if not hourly_series:
        return {k: 0.0 for k in windows} | {"api_index": 0.0, "max_hourly_intensity": 0.0}

    # Extract numerical rainfall list sorted chronologically
    # Assume items are ordered oldest to newest, or sort by timestamp if provided
    values = []
    for item in hourly_series:
        val = item.get("intensity_1h_mm")
        if val is None:
            val = item.get("rainfall_mm", 0.0)
        values.append(max(0.0, float(val)))

    total_records = len(values)
    results: Dict[str, Any] = {}

    for name, hours in windows.items():
        if total_records >= hours:
            window_slice = values[-hours:]
        else:
            window_slice = values
        results[name] = round(sum(window_slice), 2)

    # Maximum 1h intensity in the series
    results["max_hourly_intensity"] = round(max(values) if values else 0.0, 2)

    # Calculate Antecedent Precipitation Index (API): API = sum(P_d * k^d)
    # Split into 24-hour daily chunks going backwards
    api_index = 0.0
    daily_chunks = []
    idx = total_records
    while idx > 0 and len(daily_chunks) < 14:  # Up to 14 days
        start = max(0, idx - 24)
        daily_chunks.append(sum(values[start:idx]))
        idx = start

    for day_idx, daily_sum in enumerate(daily_chunks, start=1):
        weight = api_decay_factor ** day_idx
        api_index += daily_sum * weight

    results["api_index"] = round(api_index, 2)
    results["records_evaluated"] = total_records
    results["computed_at"] = datetime.now(timezone.utc).isoformat()
    return results
