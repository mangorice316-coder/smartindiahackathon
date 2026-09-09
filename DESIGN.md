# Design System: AI-Powered Landslide Risk Intelligence & Early Warning System
*Mission-Critical Emergency Operations Center (EOC) UI/UX Specification*

---

## 1. Visual Theme & Authority Atmosphere
- **Atmosphere:** State Emergency Operations Center (SEOC) command terminal fused with tactical GIS spatial intelligence.
- **Density:** *Cockpit Balanced* (Level 6) — High information density without visual clutter; instant situational awareness for emergency commanders.
- **Tone:** Authoritative, disciplined, calm, and scientific. Zero startup clichés, zero generic neon purple glowing gradients, zero ungrounded confidence claims.
- **Safety Indicators:** Prominent, persistent operational mode banners:
  - Demo / Simulation Mode: `[DEMO / SIMULATION DATA ACTIVE - NOT FOR OFFICIAL RESCUE OPERATIONS]`
  - Real Data Mode: `[LIVE SENSOR INGESTION - OPEN-METEO ACTIVE]`

---

## 2. Calibrated Color Palette & Hazard Tiers

### Hazard & Operational Category Palette
- **CRITICAL / EVACUATION (`#ef4444` / `rgba(239, 68, 68, 0.60)`):** Imminent slope failure ($F_s < 1.0$, Risk > 70). Mandatory siren activation and immediate lifeline evacuation.
- **HIGH / WATCH (`#f97316` / `rgba(249, 115, 22, 0.45)`):** Elevated pore pressure ($1.0 \le F_s \le 1.3$, Risk 51-70). Field inspection dispatch and shelter readiness.
- **MODERATE / ADVISORY (`#f59e0b` / `rgba(245, 158, 11, 0.35)`):** Rainfall threshold advisory (Risk 31-50). Drainage culvert checks and 6-hourly AWS monitoring.
- **LOW / NORMAL (`#10b981` / `rgba(16, 185, 129, 0.25)`):** Stable mechanical regime ($F_s > 1.3$, Risk 0-30). Routine remote telemetry.

### Surfaces & Typography
- **Obsidian Canvas (`#090d16`):** Deep, low-fatigue command center background.
- **Charcoal Surface (`#111827`):** Elevated container cards and telemetry panes.
- **Surface Hover (`#1f293d`):** Interactive card focus and table hover states.
- **Cyan Signal (`#00e5ff`):** Primary GIS interaction accent, active layer switches, and crosshairs.
- **Text Primary (`#f8fafc`):** High-contrast readable typography ($> 7:1$ WCAG AAA contrast ratio).
- **Text Muted (`#94a3b8`):** Sensor timestamps, geotechnical units, and metadata annotations.
- **Structural Border (`rgba(51, 65, 85, 0.4)`):** 1px subtle tactical grid boundary dividers.

---

## 3. Typographic Architecture
- **Display & Headings:** `Space Grotesk`, sans-serif — Track-tight (`letter-spacing: -0.02em`), geometric, authoritative, and scientific.
- **Body & Operational Telemetry:** `Plus Jakarta Sans`, sans-serif — Open letterforms, generous line-height (`1.6`), maximum legibility for incident commanders under stress.
- **Monospace & Sensor Feeds:** `JetBrains Mono`, monospace — For geotechnical Factor of Safety ($F_s$), GPS coordinates, precipitation rates ($\text{mm/h}$), and timestamp logs.

---

## 4. Interactive GIS Canvas & Micro-Interactions
- **Multi-Layer Toggle:** Fast client-side vector toggles for Hazard Polygons, Rainfall Radar, Critical Lifelines (Highways, Bridges, Hospitals, Schools, Power), and Historical Scars.
- **Feature Inspection Popups:** Instant display of local Factor of Safety ($F_s$), current 24h precipitation, population at risk, and top XAI hazard drivers.
- **Simulation Control Deck:** Tactile sliders for rainfall multipliers ($125\%, 150\%, 200\%$) with instant client-side delta diffing ($\Delta R$, newly breached red zones).
- **One-Click Actions:** 1-Click Alert Acknowledgement, 1-Click Field Team Task Dispatch, and 1-Click SitRep PDF/HTML Export.

---

## 5. Explicit Anti-Pattern Bans (Anti-Slop Guardrails)
- ❌ No generic AI purple gradients across dark backgrounds.
- ❌ No floating circular spinners (use tactical skeleton bars and live sensor pulse dots).
- ❌ No hiding data provenance or claiming 100% predictive certainty.
- ❌ No generic filler text ("Explore your possibilities", "AI is working magic").
- ❌ No altering historical records during what-if simulations.
