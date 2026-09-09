"""Rainfall What-If Simulation Engine.

AI-Powered Landslide Risk Intelligence & Early Warning System.
Executes scenario testing against decoupled in-memory states without mutating historical records.
Supports side-by-side visualization, difference layers, scenario comparison (A vs B),
SITREP report generation, time-series projections, and LRU scenario caching.
"""
from datetime import datetime, timezone
import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.entities import Location, Simulation, Infrastructure
from app.engine.risk_engine import assess_location_risk, classify_risk_score
from app.ml.model_registry import get_active_pipeline
from app.models.schemas import (
    SimulationRequest,
    SimulationResponse,
    SimulationLocationResult,
    SimulationComparisonRequest,
    SimulationComparisonResponse,
    SimulationComparisonLocationResult,
    SimulationReportResponse,
    SimulationTimeSeriesRequest,
    SimulationTimeSeriesResponse,
    SimulationTimeSeriesPoint
)
from app.simulation.scenario_cache import scenario_cache
from app.audit.logger import log_audit_event


SCIENTIFIC_DISCLAIMER = (
    "Simulation results represent model-based scenarios and should be interpreted "
    "as decision-support information, not deterministic predictions of landslide occurrence."
)


def run_rainfall_simulation(
    db: Session,
    request: SimulationRequest,
    user_name: str = "ANALYST",
    use_cache: bool = True
) -> SimulationResponse:
    """Execute what-if precipitation scenario against cloned in-memory state.

    Modifies ONLY rainfall-derived model inputs and hydrologically coupled
    soil moisture. Terrain, slope, geology, soil cohesion, bulk density,
    and land cover remain strictly immutable.
    """
    pipeline = get_active_pipeline()
    model_version = pipeline.version_tag or "v1.2.0-gradient-boosting"

    locations = db.query(Location).all()
    location_count = len(locations)

    # 1. Check Scenario Cache
    cache_key = scenario_cache.generate_key(
        rainfall_multiplier=request.rainfall_multiplier,
        additional_rainfall_mm=request.additional_rainfall_mm,
        duration_hours=request.duration_hours,
        saturation_override=request.saturation_override,
        model_version=model_version,
        location_count=location_count
    )

    if use_cache:
        cached = scenario_cache.get(cache_key)
        if cached is not None:
            # Return cached response with cache flag
            cached_copy = cached.model_copy(update={"from_cache": True})
            return cached_copy

    # 2. Execute Simulation Across All Monitored Catchments
    location_results: List[SimulationLocationResult] = []
    escalated_zones_count = 0
    newly_critical_count = 0
    newly_high_count = 0
    total_additional_pop_exposed = 0

    for loc in locations:
        tf = loc.terrain_feature
        sf = loc.soil_feature
        ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
        eo = loc.environmental_observations[-1] if loc.environmental_observations else None
        lcf = loc.land_cover_feature
        infras = [
            {
                "id": inf.id,
                "name": inf.name,
                "asset_type": inf.asset_type,
                "lifeline_tier": inf.lifeline_tier,
                "capacity": inf.capacity,
                "exposure_weight": inf.exposure_weight
            } for inf in loc.infrastructures
        ]

        if not (tf and sf and ro and eo and lcf):
            continue

        # A. Baseline Assessment (Unmodified DB state)
        baseline_res = assess_location_risk(
            location_id=loc.id,
            location_name=loc.name,
            district=loc.district,
            terrain={"slope_degrees": tf.slope_degrees, "twi": tf.twi},
            soil={
                "cohesion_kpa": sf.cohesion_kpa,
                "friction_angle_deg": sf.friction_angle_deg,
                "soil_depth_m": sf.soil_depth_m,
                "bulk_density_kn_m3": sf.bulk_density_kn_m3
            },
            rainfall={
                "intensity_1h_mm": ro.intensity_1h_mm,
                "accum_24h_mm": ro.accum_24h_mm,
                "antecedent_72h_mm": ro.antecedent_72h_mm
            },
            environment={"soil_moisture_ratio": eo.soil_moisture_ratio},
            land_cover={
                "ndvi_index": lcf.ndvi_index,
                "road_cut_distance_m": lcf.road_cut_distance_m
            },
            infrastructures=infras,
            population=loc.population or 1000,
            historical_count=len(loc.historical_landslides)
        )

        # B. Simulated Cloned Conditions (Rainfall-derived inputs ONLY)
        multiplier = request.rainfall_multiplier
        extra_mm = request.additional_rainfall_mm
        dur_hrs = max(1, request.duration_hours)

        sim_rain_1h = round(ro.intensity_1h_mm * multiplier + (extra_mm / dur_hrs), 2)
        sim_rain_24h = round((ro.accum_24h_mm * multiplier) + extra_mm, 2)
        sim_rain_72h = round((ro.antecedent_72h_mm * multiplier) + extra_mm, 2)

        # Hydrologically coupled soil moisture ratio (0.0 to 1.0)
        if request.saturation_override is not None:
            sim_moisture = request.saturation_override
        else:
            # Volumetric saturation delta based on physical absorption
            moisture_delta = min(0.35, (extra_mm + (ro.accum_24h_mm * (multiplier - 1.0))) / 400.0)
            sim_moisture = round(min(0.98, max(0.20, eo.soil_moisture_ratio + moisture_delta)), 3)

        # C. Run Identical Active Model & Physics
        sim_res = assess_location_risk(
            location_id=loc.id,
            location_name=loc.name,
            district=loc.district,
            terrain={"slope_degrees": tf.slope_degrees, "twi": tf.twi},
            soil={
                "cohesion_kpa": sf.cohesion_kpa,
                "friction_angle_deg": sf.friction_angle_deg,
                "soil_depth_m": sf.soil_depth_m,
                "bulk_density_kn_m3": sf.bulk_density_kn_m3
            },
            rainfall={
                "intensity_1h_mm": sim_rain_1h,
                "accum_24h_mm": sim_rain_24h,
                "antecedent_72h_mm": sim_rain_72h
            },
            environment={"soil_moisture_ratio": sim_moisture},
            land_cover={
                "ndvi_index": lcf.ndvi_index,
                "road_cut_distance_m": lcf.road_cut_distance_m
            },
            infrastructures=infras,
            population=loc.population or 1000,
            historical_count=len(loc.historical_landslides)
        )

        base_score = baseline_res["overall_risk_score"]
        sim_score = sim_res["overall_risk_score"]
        delta_score = round(sim_score - base_score, 1)

        base_cat = baseline_res["risk_category"]
        sim_cat = sim_res["risk_category"]
        escalated = (base_cat != sim_cat and sim_score > base_score)

        # Difference classification
        if sim_cat == "CRITICAL" and base_cat != "CRITICAL":
            diff_class = "NEWLY_CRITICAL"
            newly_critical_count += 1
            total_additional_pop_exposed += (loc.population or 0)
        elif sim_cat == "HIGH" and base_cat not in ["HIGH", "CRITICAL"]:
            diff_class = "NEWLY_HIGH"
            newly_high_count += 1
        elif delta_score >= 5.0:
            diff_class = "RISK_INCREASED"
        elif delta_score <= -5.0:
            diff_class = "RISK_DECREASED"
        else:
            diff_class = "UNCHANGED"

        if escalated:
            escalated_zones_count += 1

        # Exposed lifelines under simulated deluge
        exposed_lifelines = []
        if sim_cat in ["HIGH", "CRITICAL"]:
            exposed_lifelines = infras

        location_results.append(
            SimulationLocationResult(
                location_id=loc.id,
                location_name=loc.name,
                district=loc.district,
                latitude=loc.latitude,
                longitude=loc.longitude,
                baseline_risk_score=base_score,
                simulated_risk_score=sim_score,
                risk_score_delta=delta_score,
                baseline_category=base_cat,
                simulated_category=sim_cat,
                category_escalated=escalated,
                baseline_fs=baseline_res["geotechnical_fs"],
                simulated_fs=sim_res["geotechnical_fs"],
                baseline_hazard=baseline_res.get("hazard_score", 0.0),
                simulated_hazard=sim_res.get("hazard_score", 0.0),
                baseline_exposure=baseline_res.get("exposure_score", 0.0),
                simulated_exposure=sim_res.get("exposure_score", 0.0),
                difference_class=diff_class,
                newly_exposed_infrastructure_count=len(exposed_lifelines),
                affected_infrastructure_names=[inf["name"] for inf in exposed_lifelines],
                exposed_lifeline_details=exposed_lifelines,
                affected_population=loc.population or 0
            )
        )

    # Sort results by highest risk delta descending
    location_results.sort(key=lambda x: x.risk_score_delta, reverse=True)

    summary = {
        "scenario_name": request.scenario_name,
        "multiplier": request.rainfall_multiplier,
        "additional_mm": request.additional_rainfall_mm,
        "duration_hours": request.duration_hours,
        "escalated_zones": escalated_zones_count,
        "newly_critical_zones": newly_critical_count,
        "newly_high_zones": newly_high_count,
        "additional_population_exposed": total_additional_pop_exposed
    }

    # Record simulation run in the database
    sim_entity = Simulation(
        scenario_name=request.scenario_name,
        rainfall_multiplier=request.rainfall_multiplier,
        additional_rainfall_mm=request.additional_rainfall_mm,
        duration_hours=request.duration_hours,
        soil_saturation_factor=request.saturation_override or 0.85,
        results_summary_json=summary,
        executed_by_user=user_name,
        is_demo=True
    )
    db.add(sim_entity)
    db.commit()

    # Log audit event
    log_audit_event(
        db=db,
        action_type="RUN_RAINFALL_SIMULATION",
        user_name=user_name,
        entity_type="Simulation",
        entity_id=str(sim_entity.id),
        payload_summary=summary
    )

    response = SimulationResponse(
        scenario_name=request.scenario_name,
        timestamp=datetime.now(timezone.utc),
        executed_by=user_name,
        parameters={
            "rainfall_multiplier": request.rainfall_multiplier,
            "additional_rainfall_mm": request.additional_rainfall_mm,
            "duration_hours": request.duration_hours,
            "saturation_override": request.saturation_override
        },
        active_model_version=model_version,
        locations_evaluated=len(location_results),
        escalated_zones_count=escalated_zones_count,
        newly_critical_count=newly_critical_count,
        newly_high_count=newly_high_count,
        total_additional_population_exposed=total_additional_pop_exposed,
        results=location_results,
        from_cache=False,
        disclaimer=SCIENTIFIC_DISCLAIMER
    )

    # Save to Cache
    scenario_cache.set(cache_key, response)

    return response


def compare_rainfall_scenarios(
    db: Session,
    request_a: SimulationRequest,
    request_b: SimulationRequest,
    user_name: str = "ANALYST"
) -> SimulationComparisonResponse:
    """Execute and compare two distinct rainfall scenarios (Scenario A vs Scenario B)."""
    res_a = run_rainfall_simulation(db, request_a, user_name=user_name)
    res_b = run_rainfall_simulation(db, request_b, user_name=user_name)

    map_a = {item.location_id: item for item in res_a.results}
    comparison_results: List[SimulationComparisonLocationResult] = []

    escalated_in_b_count = 0
    newly_critical_in_b_count = 0
    net_additional_pop = 0

    for item_b in res_b.results:
        item_a = map_a.get(item_b.location_id)
        if not item_a:
            continue

        score_delta = round(item_b.simulated_risk_score - item_a.simulated_risk_score, 1)
        is_crit_in_b = (item_b.simulated_category == "CRITICAL" and item_a.simulated_category != "CRITICAL")
        is_high_in_b = (item_b.simulated_category == "HIGH" and item_a.simulated_category not in ["HIGH", "CRITICAL"])

        if score_delta > 0:
            escalated_in_b_count += 1
        if is_crit_in_b:
            newly_critical_in_b_count += 1
            net_additional_pop += item_b.affected_population

        # Newly exposed lifelines in B compared to A
        lifelines_a = set(item_a.affected_infrastructure_names)
        lifelines_b = [name for name in item_b.affected_infrastructure_names if name not in lifelines_a]

        comparison_results.append(
            SimulationComparisonLocationResult(
                location_id=item_b.location_id,
                location_name=item_b.location_name,
                district=item_b.district,
                score_a=item_a.simulated_risk_score,
                score_b=item_b.simulated_risk_score,
                score_delta_b_minus_a=score_delta,
                category_a=item_a.simulated_category,
                category_b=item_b.simulated_category,
                fs_a=item_a.simulated_fs,
                fs_b=item_b.simulated_fs,
                is_newly_critical_in_b=is_crit_in_b,
                is_newly_high_in_b=is_high_in_b,
                additional_population_in_b=item_b.affected_population if is_crit_in_b else 0,
                newly_exposed_lifelines_in_b=lifelines_b
            )
        )

    # Sort by highest escalation in B descending
    comparison_results.sort(key=lambda x: x.score_delta_b_minus_a, reverse=True)

    log_audit_event(
        db=db,
        action_type="COMPARE_RAINFALL_SCENARIOS",
        user_name=user_name,
        payload_summary={
            "scenario_a": request_a.scenario_name,
            "scenario_b": request_b.scenario_name,
            "escalated_in_b_count": escalated_in_b_count,
            "newly_critical_in_b_count": newly_critical_in_b_count
        }
    )

    return SimulationComparisonResponse(
        timestamp=datetime.now(timezone.utc),
        scenario_a_parameters=res_a.parameters,
        scenario_b_parameters=res_b.parameters,
        total_locations_compared=len(comparison_results),
        escalated_in_b_count=escalated_in_b_count,
        newly_critical_in_b_count=newly_critical_in_b_count,
        net_additional_population_exposed=net_additional_pop,
        results=comparison_results,
        disclaimer=SCIENTIFIC_DISCLAIMER
    )


def generate_simulation_geojson(
    db: Session,
    request: SimulationRequest,
    layer_type: str = "difference"
) -> Dict[str, Any]:
    """Generate GeoJSON FeatureCollection for baseline, scenario, or difference map layers."""
    sim_res = run_rainfall_simulation(db, request)

    color_by_cat = {
        "CRITICAL": "#ef4444",
        "HIGH": "#f97316",
        "MODERATE": "#eab308",
        "LOW": "#10b981"
    }

    color_by_diff = {
        "NEWLY_CRITICAL": "#dc2626",
        "NEWLY_HIGH": "#ea580c",
        "RISK_INCREASED": "#f59e0b",
        "UNCHANGED": "#64748b",
        "RISK_DECREASED": "#10b981"
    }

    features = []
    for item in sim_res.results:
        if item.latitude is None or item.longitude is None:
            continue

        if layer_type == "baseline":
            score = item.baseline_risk_score
            category = item.baseline_category
            color = color_by_cat.get(category, "#10b981")
            fs = item.baseline_fs
        elif layer_type == "scenario":
            score = item.simulated_risk_score
            category = item.simulated_category
            color = color_by_cat.get(category, "#ef4444")
            fs = item.simulated_fs
        else: # difference
            score = item.risk_score_delta
            category = item.difference_class
            color = color_by_diff.get(item.difference_class, "#64748b")
            fs = item.simulated_fs

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [item.longitude, item.latitude]
            },
            "properties": {
                "location_id": item.location_id,
                "location_name": item.location_name,
                "district": item.district,
                "layer_type": layer_type,
                "score": score,
                "category": category,
                "baseline_score": item.baseline_risk_score,
                "simulated_score": item.simulated_risk_score,
                "risk_delta": item.risk_score_delta,
                "baseline_fs": item.baseline_fs,
                "simulated_fs": item.simulated_fs,
                "difference_class": item.difference_class,
                "category_escalated": item.category_escalated,
                "color": color,
                "marker_radius": max(8.0, min(22.0, 8.0 + (abs(score) * 0.14))),
                "affected_infrastructure_count": item.newly_exposed_infrastructure_count,
                "affected_infrastructure": item.affected_infrastructure_names,
                "population": item.affected_population,
                "is_demo": True
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "metadata": {
            "scenario_name": request.scenario_name,
            "layer_type": layer_type,
            "parameters": sim_res.parameters,
            "model_version": sim_res.active_model_version,
            "features_count": len(features),
            "disclaimer": SCIENTIFIC_DISCLAIMER
        },
        "features": features
    }


def generate_simulation_report(
    db: Session,
    request: SimulationRequest,
    report_format: str = "json"
) -> SimulationReportResponse:
    """Generate formal scenario assessment report (JSON, HTML, or Markdown SITREP)."""
    sim_res = run_rainfall_simulation(db, request)
    report_id = f"SIM-REP-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"

    critical_lifelines = []
    catchment_details = []
    for item in sim_res.results:
        catchment_details.append({
            "location_id": item.location_id,
            "location_name": item.location_name,
            "district": item.district,
            "baseline_score": item.baseline_risk_score,
            "simulated_score": item.simulated_risk_score,
            "delta": item.risk_score_delta,
            "baseline_category": item.baseline_category,
            "simulated_category": item.simulated_category,
            "baseline_fs": item.baseline_fs,
            "simulated_fs": item.simulated_fs,
            "difference_class": item.difference_class,
            "population_at_risk": item.affected_population,
            "threatened_assets": item.affected_infrastructure_names
        })
        if item.simulated_category in ["HIGH", "CRITICAL"]:
            for inf in item.exposed_lifeline_details:
                critical_lifelines.append({
                    "location": item.location_name,
                    "district": item.district,
                    "name": inf["name"],
                    "asset_type": inf["asset_type"],
                    "lifeline_tier": inf["lifeline_tier"],
                    "capacity": inf["capacity"]
                })

    executive_summary = {
        "total_locations_evaluated": sim_res.locations_evaluated,
        "escalated_zones_count": sim_res.escalated_zones_count,
        "newly_critical_count": sim_res.newly_critical_count,
        "newly_high_count": sim_res.newly_high_count,
        "total_additional_population_exposed": sim_res.total_additional_population_exposed,
        "total_threatened_lifeline_assets": len(critical_lifelines)
    }

    limitations = [
        "Scenario assumes spatially uniform precipitation intensification over modeled duration.",
        "Soil saturation modeling approximates infinite slope limit-equilibrium drainage response.",
        "Secondary cascade hazards (debris damming, glacial lake outbursts) are not modeled.",
        "Requires real-time ground truth calibration from installed tiltmeters and piezometers."
    ]

    formatted_content = None
    if report_format == "markdown":
        md_lines = [
            f"# Landslide Risk Scenario Assessment Report ({report_id})",
            f"**Scenario:** {request.scenario_name}",
            f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"**Model Version:** {sim_res.active_model_version}",
            f"**Parameters:** Multiplier {request.rainfall_multiplier}x | Added Rain {request.additional_rainfall_mm}mm | Window {request.duration_hours}h",
            "",
            "## Executive Summary",
            f"- **Locations Evaluated:** {sim_res.locations_evaluated}",
            f"- **Escalated Risk Zones:** {sim_res.escalated_zones_count}",
            f"- **Newly Critical Zones:** {sim_res.newly_critical_count}",
            f"- **Additional Population Exposed:** {sim_res.total_additional_population_exposed:,}",
            f"- **Threatened Lifeline Assets:** {len(critical_lifelines)}",
            "",
            "## Catchment Scenario Impacts",
            "| Catchment | District | Baseline | Simulated | Delta | Category Change | Fs Change | Threatened Assets |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
        ]
        for cd in catchment_details:
            assets_str = ", ".join(cd["threatened_assets"][:2]) if cd["threatened_assets"] else "None"
            md_lines.append(
                f"| {cd['location_name']} | {cd['district']} | {cd['baseline_score']} ({cd['baseline_category']}) | "
                f"{cd['simulated_score']} ({cd['simulated_category']}) | +{cd['delta']} | "
                f"{cd['baseline_category']} &rarr; {cd['simulated_category']} | "
                f"{cd['baseline_fs']} &rarr; {cd['simulated_fs']} | {assets_str} |"
            )
        md_lines.extend([
            "",
            "## Methodological Limitations",
            *[f"- {lim}" for lim in limitations],
            "",
            "## Mandatory Scientific Disclaimer",
            f"> {SCIENTIFIC_DISCLAIMER}"
        ])
        formatted_content = "\n".join(md_lines)

    return SimulationReportResponse(
        report_id=report_id,
        generated_at=datetime.now(timezone.utc),
        scenario_name=request.scenario_name,
        parameters=sim_res.parameters,
        model_version=sim_res.active_model_version,
        executive_summary=executive_summary,
        catchment_details=catchment_details,
        critical_lifelines_exposed=critical_lifelines,
        limitations=limitations,
        disclaimer=SCIENTIFIC_DISCLAIMER,
        formatted_content=formatted_content
    )


def project_simulation_timeseries(
    db: Session,
    request: SimulationTimeSeriesRequest
) -> SimulationTimeSeriesResponse:
    """Project hourly precipitation surge and risk escalation curves over storm window."""
    loc = db.query(Location).filter(Location.id == request.location_id).first()
    if not loc:
        raise ValueError(f"Location ID {request.location_id} not found.")

    ro = loc.rainfall_observations[-1] if loc.rainfall_observations else None
    base_intensity = ro.intensity_1h_mm if ro else 12.0

    dur = max(6, min(72, request.duration_hours))
    total_added = request.additional_rainfall_mm
    mult = request.rainfall_multiplier

    peak_hour = int(dur * 0.4)
    series_points: List[SimulationTimeSeriesPoint] = []

    cum_base = 0.0
    cum_sim = 0.0

    for h in range(1, dur + 1):
        # Gaussian/gamma shape storm profile peaking at peak_hour
        dist = abs(h - peak_hour) / float(dur * 0.35)
        storm_factor = math.exp(-0.5 * (dist ** 2))

        # Hourly rain calculations
        hourly_base = round(base_intensity * (0.6 + 0.4 * storm_factor), 2)
        added_hourly = (total_added / dur) * (1.2 * storm_factor + 0.5)
        hourly_sim = round((hourly_base * mult) + added_hourly, 2)

        cum_base += hourly_base
        cum_sim += hourly_sim

        # Projected risk progression based on cumulative moisture load
        risk_fraction = min(1.0, cum_sim / 250.0)
        proj_score = round(min(100.0, 35.0 + (risk_fraction * 58.0)), 1)
        proj_fs = round(max(0.65, 1.45 - (risk_fraction * 0.65)), 2)
        proj_cat = classify_risk_score(proj_score)

        series_points.append(
            SimulationTimeSeriesPoint(
                hour=h,
                timestamp=f"+{h:02d}h",
                baseline_hourly_mm=hourly_base,
                simulated_hourly_mm=hourly_sim,
                cumulative_baseline_mm=round(cum_base, 1),
                cumulative_simulated_mm=round(cum_sim, 1),
                projected_risk_score=proj_score,
                projected_fs=proj_fs,
                projected_category=proj_cat
            )
        )

    return SimulationTimeSeriesResponse(
        location_id=loc.id,
        location_name=loc.name,
        district=loc.district,
        duration_hours=dur,
        series=series_points,
        disclaimer=SCIENTIFIC_DISCLAIMER
    )
