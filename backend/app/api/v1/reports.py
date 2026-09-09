"""Situation Reports (SitRep) API.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Generates structured JSON and printable emergency situation reports.
"""
from fastapi import APIRouter, Depends, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User
from app.auth.security import get_current_user
from app.audit.logger import log_audit_event
from app.reports.generator import generate_situation_report

router = APIRouter(prefix="/reports", tags=["Situation Reports & SitRep"])


@router.get("/sitrep")
def get_sitrep_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate structured Situation Report (SitRep) in JSON format."""
    report = generate_situation_report(db=db)
    log_audit_event(
        db=db,
        action_type="GENERATE_SITREP",
        user_name=current_user.username if current_user else "SYSTEM_OPERATOR",
        entity_type="Report",
        entity_id=report.get("report_id"),
        payload_summary={
            "format": "JSON",
            "critical_zones": report["executive_summary"]["risk_distribution"].get("CRITICAL", 0),
            "active_alerts": report["executive_summary"]["active_emergency_alerts_count"]
        }
    )
    return report


@router.get("/html", response_class=HTMLResponse)
def get_sitrep_html(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate professional printable HTML Situation Report for emergency commanders."""
    report = generate_situation_report(db=db)
    log_audit_event(
        db=db,
        action_type="GENERATE_SITREP",
        user_name=current_user.username if current_user else "SYSTEM_OPERATOR",
        entity_type="Report",
        entity_id=report.get("report_id"),
        payload_summary={
            "format": "HTML",
            "critical_zones": report["executive_summary"]["risk_distribution"].get("CRITICAL", 0),
            "active_alerts": report["executive_summary"]["active_emergency_alerts_count"]
        }
    )
    summary = report["executive_summary"]
    dist = summary["risk_distribution"]

    hotspots_html = "".join([
        f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">{h['location_name']} ({h['district']})</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; color: {'#dc2626' if h['risk_category']=='CRITICAL' else '#ea580c'}; font-weight: bold;">{h['risk_category']} ({h['risk_score']}/100)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Fs = {h['geotechnical_fs']} ({h['geotechnical_stability']})</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">{', '.join([d['factor'] + ': ' + d['value'] for d in h['top_drivers']])}</td>
        </tr>
        """ for h in report["critical_hotspots"]
    ])

    alerts_html = "".join([
        f"""
        <li style="margin-bottom: 8px;">
            <strong>[{a['severity']}] Zone {a['location_id']} (Score: {a['risk_score']})</strong><br>
            <span>Trigger: {a['trigger_condition']}</span><br>
            <em style="color: #b91c1c;">SOP Action: {a['recommended_action']}</em>
        </li>
        """ for a in report["active_alerts"]
    ]) or "<li>No critical alerts currently triggered.</li>"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{report['report_title']}</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }}
            .header {{ border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 24px; }}
            .badge {{ background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }}
            .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }}
            .kpi-card {{ background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center; }}
            .kpi-val {{ font-size: 24px; font-weight: bold; color: #0369a1; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }}
            th {{ background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }}
            .disclaimer {{ margin-top: 30px; padding: 12px; background: #fef2f2; border-left: 4px solid #ef4444; font-size: 12px; color: #7f1d1d; }}
        </style>
    </head>
    <body>
        <div class="header">
            <span class="badge">{report['classification']}</span>
            <h1 style="margin: 8px 0 4px 0;">{report['report_title']}</h1>
            <div style="color: #64748b; font-size: 13px;">Report ID: {report['report_id']} | Generated: {report['timestamp']}</div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div>Monitored Catchments</div>
                <div class="kpi-val">{summary['monitored_zones_count']}</div>
            </div>
            <div class="kpi-card">
                <div>Critical Zones</div>
                <div class="kpi-val" style="color: #dc2626;">{dist.get('CRITICAL', 0)}</div>
            </div>
            <div class="kpi-card">
                <div>Active Alerts</div>
                <div class="kpi-val" style="color: #ea580c;">{summary['active_emergency_alerts_count']}</div>
            </div>
            <div class="kpi-card">
                <div>Max 24h Rainfall</div>
                <div class="kpi-val">{summary['max_24h_recorded_rainfall_mm']} mm</div>
            </div>
        </div>

        <h3>1. High & Critical Landslide Hotspots</h3>
        <table>
            <thead>
                <tr>
                    <th>Catchment / District</th>
                    <th>Risk Category</th>
                    <th>Geotechnical Stability</th>
                    <th>Primary Hazard Attribution (XAI)</th>
                </tr>
            </thead>
            <tbody>
                {hotspots_html}
            </tbody>
        </table>

        <h3 style="margin-top: 24px;">2. Active Early Warnings & Recommended SOPs</h3>
        <ul>
            {alerts_html}
        </ul>

        <h3>3. System Provenance & Model Telemetry</h3>
        <p style="font-size: 13px; color: #334155;">
            Active Model: <strong>{report['system_provenance']['ml_model_version']}</strong> ({report['system_provenance']['model_algorithm']}) | 
            Validation Accuracy: <strong>{report['system_provenance']['model_accuracy']}</strong> | 
            Data Mode: <strong>{report['system_provenance']['operating_mode']}</strong>
        </p>

        <div class="disclaimer">
            <strong>CRITICAL GEOTECHNICAL DISCLAIMER:</strong> {report['scientific_disclaimer']}
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
