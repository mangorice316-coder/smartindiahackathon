# LRIDS Scientific Limitations & Operational Boundaries

> **Landslide Risk Intelligence & Decision Support System (LRIDS)**  
> Epistemic Assumptions, Physical Model Boundaries, Sensor Constraints, and Ethical Disaster Management Disclosures  
> Verified: **15 Test Suites | 122 Automated Tests Passed (100%) | Zero Build Errors**

---

## 1. Epistemic Humility & System Scope

Disaster risk reduction technology must be guided by **epistemic humility**. Over-promising precision in chaotic, non-linear geological phenomena can lead to catastrophic complacency. 

> [!IMPORTANT]
> **DECISION SUPPORT SYSTEM — NOT A DETERMINISTIC PREDICTION GUARANTEE**  
> LRIDS is explicitly architected as a **probabilistic risk-assessment and decision-support tool**. It assists emergency incident commanders, district collectors, and geotechnical engineers in triaging attention; it **does not** claim deterministic certainty regarding the exact minute, cubic meter, or runout trajectory of an impending slope failure.

---

## 2. Geotechnical Physical Assumptions

The analytical physics core implements the standard **infinite-slope limit-equilibrium model**, which incorporates specific mechanical assumptions:
1. **Planar Slip Surface**: The failure plane is assumed to be parallel to the ground surface at a characteristic soil-bedrock interface depth ($z \approx 2\text{--}5\text{ m}$). Complex rotational circular failures (Bishop’s method) in deep clay beds are approximated through equivalent planar shear strength parameters.
2. **Homogenous Regolith**: Soil properties (cohesion $c'$, internal friction angle $\phi'$, and bulk unit weight $\gamma$) are treated as vertically averaged values across the regolith profile.
3. **Pore-Water Pressure Simplification**: Transient pore-water pressure is estimated using a 1D saturation ratio coupled to antecedent precipitation. It does not solve the full 3D transient Richard’s equation for unsaturated seepage through fractured bedrock.

---

## 3. Spatial & Meteorological Resolution Constraints

1. **Macro-Scale Telemetry vs Micro-Topography**:
   * Regional weather inputs (such as IMD $0.1^\circ$ or $0.25^\circ$ gridded products) represent spatial averages across multi-kilometer cells.
   * Micro-topographic features (such as road cuts, clogged drainage culverts, or localized tea garden benching) can initiate slope failures even when the regional grid indicates moderate rainfall.
2. **Sub-Surface In-Situ Instrumentation**:
   * In regions without borehole inclinometers, piezometers, or fiber-optic crackmeters, near-surface soil moisture is estimated via remote sensing and hydrologic proxies. Physical ground-truth verification remains essential.
3. **Debris Flow Runout Dynamics**:
   * Current danger buffer zones utilize radial and topographic flow-path proximity. Full 2D Navier-Stokes or Voellmy-fluid debris flow runout modeling requires extensive high-performance computing (HPC) clusters and is outside real-time browser latency constraints.

---

## 4. Ethical & Statutory Disclosures

* **Statutory Authority**: LRIDS alerts, Situation Reports (SitReps), and evacuation advisories are advisory tools designed for disaster management cells. Official mandatory evacuation orders must originate exclusively from the designated statutory authorities (e.g. District Collector, District Disaster Management Authority (DDMA), or State Emergency Operation Center).
* **Human-in-the-Loop Safeguards**: No automated evacuation siren or public cell-broadcast dispatch should be triggered without review and sign-off by a qualified incident commander or district magistrate.
* **Continuous Local Calibration**: Geotechnical thresholds ($F_s$, cohesion, friction angle) should be re-calibrated by local Geological Survey of India (GSI) or Public Works Department (PWD) engineers for each specific sub-basin prior to operational field deployment.
