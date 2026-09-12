# Data Privacy, Ethics & Licensing Compliance

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Sections 11, 38 & Section 41.6  
**Applicable Legal Frameworks**: Indian Digital Personal Data Protection Act (DPDPA 2023), NDSAP, Open Database License (ODbL 1.0)

---

## 1. Personally Identifiable Information (PII) Evaluation

LRIDS operates strictly on physical geospatial terrain layers, geological structural maps, satellite radar telemetry, and public lifeline road networks.

### 1.1 Ingestion Privacy Audit
- **Zero Household PII**: The system strictly prohibits the ingestion of personal names, phone numbers, Aadhaar numbers, individual property ownership records, or biometric information.
- **Aggregated Vulnerability**: Human settlement exposures are modeled solely as anonymous spatial population density clusters, school buildings, and hospital centroids derived from OpenStreetMap public records.
- **Drone & High-Resolution Imagery**: Where ultra-high resolution drone photogrammetry is ingested for slope inspection, an automated Gaussian blur filter is applied to resolve any faces or vehicle registration plates prior to ML training.

---

## 2. OpenStreetMap (OSM) Licensing Compliance: ODbL 1.0

The infrastructure exposure layer (Tier 5) utilizes data contributed to OpenStreetMap. In accordance with the **Open Database License (ODbL) 1.0**:

### 2.1 Attribution Requirements (Section 4.3)
All public-facing dashboards, hazard maps, risk intelligence reports, and exported GeoJSON layers that incorporate OSM road networks or building footprints must display the official attribution:
> **"Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright"**

### 2.2 Share-Alike Guidelines (Section 4.4)
If LRIDS distributes or publicly conveys a Derivative Database composed of altered OSM feature geometries, that database will be made available under the terms of ODbL 1.0. Internal mathematical risk scores and ML model weights trained on topological relationships do not trigger Share-Alike requirements under Produced Work clauses.

---

## 3. National Data Sharing and Accessibility Policy (NDSAP) Compliance

Data sourced from the Geological Survey of India (GSI) and India Meteorological Department (IMD) is ingested under the Government of India NDSAP guidelines:
- Data is utilized for national disaster preparedness, life safety early warnings, scientific research, and civil defense.
- Direct commercial resale of raw governmental geological layers is prohibited.
- Attribution to GSI and IMD is prominently displayed across all situation room map layers.

---

## 4. Ethical Considerations in Disaster Risk Modeling

### 4.1 Evacuation False Alarms vs. Missed Events
In life-safety early warning systems, a false negative (missed landslide) can result in catastrophic loss of life, whereas excessive false positives cause warning fatigue and economic disruption.
- LRIDS calibrates its classification decision thresholds to minimize missed detections in densely populated valley corridors.
- Confidence intervals are reported alongside every warning to prevent ungrounded panic.

### 4.2 Marginalized Hill Communities
Many vulnerable communities in the Western Ghats (e.g. tea plantation labor settlements) reside on steep colluvial slopes. LRIDS ensures that early warning alert systems do not discriminate based on infrastructure quality and guarantees equal monitoring fidelity for remote tribal hamlets.
