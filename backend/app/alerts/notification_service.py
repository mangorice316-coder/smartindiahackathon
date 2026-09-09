"""Notification Channel Abstraction Layer & Common Alerting Protocol (CAP) Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Decouples alert broadcasting from specific external vendors (SMS, Email, Push, CAP).
All simulated dispatches are explicitly marked as DEMO/SIMULATION.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import json

from app.models.entities import Alert


class NotificationChannel(ABC):
    """Abstract interface for external disaster notification delivery channels."""

    @property
    @abstractmethod
    def channel_name(self) -> str:
        pass

    @abstractmethod
    def send_notification(self, alert_data: Dict[str, Any], recipient: Optional[str] = None) -> Dict[str, Any]:
        """Deliver the alert via the specific channel adapter."""
        pass


class ConsoleNotificationChannel(NotificationChannel):
    """Local stdout logging channel for development and command-line monitoring."""

    @property
    def channel_name(self) -> str:
        return "CONSOLE"

    def send_notification(self, alert_data: Dict[str, Any], recipient: Optional[str] = None) -> Dict[str, Any]:
        code = alert_data.get("alert_code", "ALT-UNKNOWN")
        loc = alert_data.get("location_name", "Unknown Zone")
        sev = alert_data.get("severity", "WARNING")
        prio = alert_data.get("priority", "HIGH")
        msg = f"[EOC NOTIFICATION DISPATCH] [{code}] {sev} (Priority: {prio}) for {loc} -> Recipient: {recipient or 'BROADCAST'}"
        return {
            "channel": self.channel_name,
            "status": "DELIVERED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_summary": msg,
            "is_demo": True
        }


class MockSMSChannel(NotificationChannel):
    """Simulated Telecom Cell Broadcast / SMS delivery for field teams and village panchayats."""

    @property
    def channel_name(self) -> str:
        return "SMS"

    def send_notification(self, alert_data: Dict[str, Any], recipient: Optional[str] = None) -> Dict[str, Any]:
        phone = recipient or "+91-9876543210 (Panchayat EOC)"
        loc = alert_data.get("location_name", "Target Catchment")
        sev = alert_data.get("severity", "WARNING")
        action = alert_data.get("recommended_action", "Exercise caution.")

        sms_body = (
            f"[DISASTER ALERT - {sev}] NDMA/SDMA: High landslide hazard detected at {loc}. "
            f"Action: {action[:110]}... [DEMO SIMULATION NOTIFICATION]"
        )

        return {
            "channel": self.channel_name,
            "recipient": phone,
            "status": "SENT_SIMULATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sms_characters": len(sms_body),
            "sms_body": sms_body,
            "is_demo": True,
            "disclaimer": "DEMO SMS BROADCAST - NOT SENT TO REAL TELECOM CARRIER"
        }


class MockEmailChannel(NotificationChannel):
    """Simulated Official Emergency Bulletin Email channel for district collectors and NDRF battalions."""

    @property
    def channel_name(self) -> str:
        return "EMAIL"

    def send_notification(self, alert_data: Dict[str, Any], recipient: Optional[str] = None) -> Dict[str, Any]:
        email = recipient or "district-emergency-cell@sdma.gov.in"
        code = alert_data.get("alert_code", "ALT-UNKNOWN")
        loc = alert_data.get("location_name", "Target Catchment")
        sev = alert_data.get("severity", "WARNING")
        score = alert_data.get("risk_score", 0)

        subject = f"[EMERGENCY SITUATION BULLETIN] {sev}: {loc} (Risk: {round(score)}/100) - Code: {code}"
        return {
            "channel": self.channel_name,
            "recipient": email,
            "status": "SENT_SIMULATED",
            "subject": subject,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
            "disclaimer": "DEMO DISASTER BULLETIN EMAIL - SIMULATION ONLY"
        }


class CommonAlertingProtocolChannel(NotificationChannel):
    """OASIS Common Alerting Protocol (CAP v1.2) Standard Compliant Alert Formatter."""

    @property
    def channel_name(self) -> str:
        return "CAP_V12"

    def send_notification(self, alert_data: Dict[str, Any], recipient: Optional[str] = None) -> Dict[str, Any]:
        return self.format_cap_payload(alert_data)

    def format_cap_payload(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert system alert entity dictionary into OASIS CAP v1.2 JSON schema."""
        code = alert_data.get("alert_code", f"ALT-{alert_data.get('id', 1)}")
        now_iso = datetime.now(timezone.utc).isoformat()
        sev = alert_data.get("severity", "WARNING")
        loc = alert_data.get("location_name", "Monitored Zone")
        dist = alert_data.get("district", "Unknown")

        # Map internal severities to CAP standards
        cap_urgency = "Immediate" if sev in ["EVACUATION", "WARNING"] else "Expected"
        cap_severity = "Extreme" if sev == "EVACUATION" else "Severe" if sev == "WARNING" else "Moderate"
        cap_certainty = "Observed" if alert_data.get("risk_score", 0) > 80 else "Likely"

        cap_payload = {
            "identifier": f"IN-NDMA-{code}",
            "sender": "eoc-alerts@ndma.gov.in",
            "sent": now_iso,
            "status": "Actual" if not alert_data.get("is_demo", True) else "Draft",
            "msgType": "Alert",
            "scope": "Public",
            "info": {
                "category": "Geo",
                "event": "Landslide Hazard Warning",
                "urgency": cap_urgency,
                "severity": cap_severity,
                "certainty": cap_certainty,
                "eventCode": [{"valueName": "SAME", "value": "LSW"}],
                "headline": f"{sev} - Landslide Early Warning for {loc}, {dist}",
                "description": (
                    f"Operational risk score: {alert_data.get('risk_score', 0)}/100. "
                    f"Trigger: {alert_data.get('trigger_condition', 'Threshold breach')}. "
                    f"Data telemetry sources: {', '.join(alert_data.get('data_sources', ['IMD_AWS_RADAR']))}."
                ),
                "instruction": alert_data.get("recommended_action", "Adhere to local emergency administrative orders."),
                "area": {
                    "areaDesc": f"{loc} Catchment Basin, District {dist}",
                    "circle": f"{alert_data.get('latitude', 11.68)},{alert_data.get('longitude', 76.13)},2.5"
                },
                "parameter": [
                    {"valueName": "ModelVersion", "value": alert_data.get("model_version", "v1.2.0-gradient-boosting")},
                    {"valueName": "OperationalPriority", "value": alert_data.get("priority", "HIGH")},
                    {"valueName": "PhysicalRiskCategory", "value": alert_data.get("risk_category", "HIGH")},
                    {"valueName": "LifelinesExposedCount", "value": str(len(alert_data.get("affected_infrastructure", [])))}
                ]
            },
            "is_demo": True,
            "demo_disclaimer": "DEMO OASIS CAP PAYLOAD - SYNTHETIC EARLY WARNING FOR DRILL / EXERCISE"
        }
        return cap_payload


class NotificationDispatcher:
    """Central Dispatcher routing early warning notifications across registered channels."""

    def __init__(self):
        self.channels: Dict[str, NotificationChannel] = {
            "CONSOLE": ConsoleNotificationChannel(),
            "SMS": MockSMSChannel(),
            "EMAIL": MockEmailChannel(),
            "CAP": CommonAlertingProtocolChannel()
        }

    def register_channel(self, channel: NotificationChannel):
        self.channels[channel.channel_name] = channel

    def dispatch_alert(
        self,
        alert_data: Dict[str, Any],
        channels: Optional[List[str]] = None,
        recipient: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Dispatch an early warning alert to specified or all channels."""
        target_channels = channels or list(self.channels.keys())
        dispatch_receipts = []

        for ch_key in target_channels:
            if ch_key in self.channels:
                receipt = self.channels[ch_key].send_notification(alert_data, recipient=recipient)
                dispatch_receipts.append(receipt)

        return dispatch_receipts


# Global Dispatcher Singleton
notification_dispatcher = NotificationDispatcher()
