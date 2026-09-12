# Landslide Labeling & Sampling Guidelines

**Project**: AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)  
**Specification Reference**: Sections 16–20 & Section 41.4  
**Primary Authorities**: Geological Survey of India (GSI) & ISRO National Remote Sensing Centre (NRSC)

---

## 1. Ground Truth Definition & Criteria

A positive landslide label (`landslide_occurrence = 1`) denotes an actual, confirmed, mass-wasting event involving the downslope movement of soil, rock, or organic debris under the direct influence of gravity.

### 1.1 Positive Label Acceptance Criteria
A positive instance must satisfy at least one of the following authoritative criteria:
1. **Tier 1 GSI NLFC Field Inventory**: Mapped, measured, and verified on the ground by GSI field geologists. Includes documented scarp, depletion zone, transport track, and accumulation zone.
2. **Tier 2 ISRO / NRSC Landslide Atlas of India**: Delineated from high-resolution satellite remote sensing (Cartosat, Resourcesat, Sentinel-2) as part of the 80,000+ national scar inventory (1998–2022).
3. **Confirmed Sentinel-1 InSAR Coherence Loss**: InSAR coherence drop accompanied by pre/post backscatter differential ($\Delta\sigma^0 > 3.0\,\text{dB}$) coinciding with heavy monsoonal triggers ($R_{24} > 100\,\text{mm}$).

### 1.2 Point vs. Polygon Attribution Rules
- **Point Inventories (Centroids / Scarp Heads)**: When only a scarp head or scar centroid coordinate is available, a radial buffer corresponding to the estimated event magnitude is created:
  - Small / Shallow Slump: $25\,\text{m}$ radius buffer
  - Debris Slide / Torrent: $50\,\text{m}$ radius buffer
  - Catastrophic Rock Avalanche / Multi-kilometer Flow: Polygons mandatory. Points are strictly inadmissible for massive events.
- **Polygon Boundaries**: Polygonal delineations represent the full bounding envelope of the scar (rupture surface through runout deposit). Rasterization is executed onto the standard 30m grid using majority area coverage rule ($>50\%$ overlap).

---

## 2. Negative Non-Landslide Sampling Methodology

Because real terrain is predominantly stable, naive random sampling of non-landslide points severely contaminates training data with false negatives (unmapped scars or marginally stable slopes ready to fail). LRIDS enforces **Strict Absence Sampling**:

### 2.1 Criteria for Verified Stable Negative Controls (`landslide_occurrence = 0`)
1. **Low Topographic Gradient**: Terrain slope must be $< 10.0^{\circ}$. Physical slope failure cannot occur on unconfined slopes below this angle under standard earth materials.
2. **Competent Geological Formations**: Bedrock must belong to Lithology Grade 1 (fresh charnockite, massive crystalline gneiss, or unweathered basalt).
3. **Planar Slope Curvature**: Profile curvature must be planar ($|\text{curvature}| < 0.05$), precluding convergent hollows that focus subsurface pore pressure.
4. **Spatial Exclusion Buffer**: Negative points must be separated by a **minimum buffer distance of $1,000\,\text{meters}$** from any known historical landslide scar or scarp registered in GSI or ISRO databases.
5. **Hydrological Drainage**: Topographic Wetness Index must be $TWI < 6.0$, verifying well-drained terrain without stagnant water pooling.

---

## 3. Spatio-Temporal Train / Validation / Test Partitioning

To avoid spatial auto-correlation and temporal data leakage, random k-fold cross-validation is strictly forbidden. The system enforces **Spatial & Temporal Stratified Splits**:

```
TOTAL DATASET (100%)
├── TRAINING SPLIT (70%)
│   ├── Geography: Western Ghats Baseline Catchments (Wayanad, Idukki, Nilgiris)
│   └── Temporal: 2018 - 2021 Historical Monsoonal Seasons
│
├── VALIDATION SPLIT (15%)
│   ├── Geography: Transition Catchments
│   └── Temporal: 2022 Monsoon Validation Anchor
│
└── TEST SPLIT (15%) [UNSEEN HOLDOUT]
    ├── Geography: Himalayan Spatial Holdouts (Rishikesh, Rudraprayag, Shimla)
    └── Temporal: 2023 - 2024 Recent Unseen Monsoons
```

### 3.1 Spatial Transferability Validation
By holding out the Himalayan mountain terrain entirely from the primary training split and testing models trained on the Western Ghats against Himalayan valleys, the system rigorously quantifies **spatial generalizability** and prevents models from memorizing localized spatial artifacts.
