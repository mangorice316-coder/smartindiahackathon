# Algorithms and Technical Deep-Dives

The Landslide Risk Intelligence System (LRIDS) combines deterministic geotechnical engineering mechanics with probabilistic tabular machine learning to produce robust, explainable, and scientifically validated landslide hazard predictions.

---

## 1. Geotechnical Limit-Equilibrium Stability Engine

Rather than treating slope failure as an unconstrained statistical correlation, LRIDS grounds its predictions in the classical **Infinite Slope Stability Model** governed by the **Mohr-Coulomb Failure Criterion**.

### Mathematical Formulation

The Factor of Safety ($F_s$) represents the ratio of available resisting shear strength to mobilizing shear stress along a planar failure slip surface:

$$F_s = \frac{\tau_f}{\tau_m} = \frac{c' + (\sigma_n - u)\tan \phi'}{\gamma \cdot z \cdot \sin \beta \cdot \cos \beta}$$

Where:
* $c'$: Effective soil/rock cohesion ($	ext{kPa}$). Highly weathered saprolite exhibits low cohesion ($8 - 14	ext{ kPa}$), whereas fresh charnockite bedrock exhibits high cohesion ($> 28	ext{ kPa}$).
* $\phi'$: Effective internal friction angle ($	ext{degrees}$). Typical range: $26^\circ - 38^\circ$.
* $eta$: Topographic slope inclination ($	ext{degrees}$), derived from $12.5	ext{m}/30	ext{m}$ Digital Elevation Models.
* $z$: Depth to the potential failure slip surface ($	ext{meters}$), typically $1.8 - 4.5	ext{m}$ in Western Ghats colluvium.
* $\gamma$: Total unit weight of saturated soil/rock mantle ($\sim 19.5	ext{ kN/m}^3$).
* $u$: Pore-water pressure along the shear plane ($	ext{kPa}$).
* $\sigma_n$: Total normal stress on the failure plane: $\sigma_n = \gamma \cdot z \cdot \cos^2 \beta$.

### Pore-Pressure Hydrodynamic Dynamics
During torrential monsoon downpours, infiltration exceeds deep hydraulic conductivity, creating transient positive hydrostatic pore pressures that eliminate matric suction:

$$u(t) = \gamma_w \cdot m(t) \cdot z \cdot \cos^2 \beta$$

Where $\gamma_w = 9.81	ext{ kN/m}^3$ is the unit weight of water, and $m(t) \in [0, 1]$ represents the normalized saturation thickness of the soil mantle. When $u \to \sigma_n$, the effective normal stress $(\sigma_n - u) \to 0$, causing catastrophic planar shear slip ($F_s < 1.0$).

---

## 2. Dynamic Antecedent Precipitation Index ($API_{72}$)

Slope failures in weathered laterite terrain are driven by cumulative soaking over multiple days rather than isolated rainfall bursts. LRIDS computes a geometrically decaying 72-hour antecedent precipitation index:

$$API_{72} = R_{24} + k \cdot R_{48} + k^2 \cdot R_{72}$$

Where:
* $R_{24}$: Cumulative precipitation in the preceding 24 hours ($	ext{mm}$).
* $R_{48}$: Cumulative precipitation from 24h to 48h prior ($	ext{mm}$).
* $R_{72}$: Cumulative precipitation from 48h to 72h prior ($	ext{mm}$).
* $k$: Drainage decay coefficient ($k = 0.85$ for Western Ghats lateritic soils; $k = 0.75$ for high-permeability Himalayan scree).

---

## 3. Topographic Wetness Index ($TWI$)

Hydrological flow convergence accelerates pore-pressure accumulation in concave terrain hollows. LRIDS derives the steady-state wetness index from high-resolution DEMs:

$$TWI = \ln\left(\frac{a}{\tan \beta}\right)$$

Where $a$ is the specific upslope contributing catchment area per unit contour length ($	ext{m}^2/	ext{m}$), and $eta$ is the slope gradient in radians. Slopes with high $TWI$ ($> 8.5$) in combination with steep inclinations ($eta > 32^\circ$) constitute primary debris-flow initiation zones.

---

## 4. Calibrated Ensemble Machine Learning Pipeline

LRIDS employs a decoupled, offline-trained ensemble combining **Histogram-based Gradient Boosting** (`HistGradientBoostingClassifier`) and **Calibrated Probability Cross-Validation** (`CalibratedClassifierCV`).

### Algorithm Selection Rationale
* **Non-linear feature interactions**: Successfully models complex non-linear couplings (e.g., steep slope $	imes$ high pore pressure $	imes$ concave curvature).
* **Missing value resilience**: Built-in binning naturally handles sporadic missing telemetry from remote mountain sensor nodes.
* **Monotonic constraints**: Physical invariants are strictly enforced:
  $$\frac{\partial \text{Risk}}{\partial \text{Slope}} \ge 0, \quad \frac{\partial \text{Risk}}{\partial \text{Rainfall}} \ge 0, \quad \frac{\partial \text{Risk}}{\partial u} \ge 0$$

### Probabilistic Calibration
Raw classification scores are calibrated using Isotonic Regression to guarantee that a predicted 80% failure probability corresponds to an empirical 80% event frequency:

$$\min_{f} \sum_{i=1}^{N} (y_i - f(s_i))^2 \quad \text{subject to } f(s_i) \ge f(s_j) \text{ for } s_i \ge s_j$$

### Offline Model Benchmark (Holdout Test Split)
* **ROC-AUC**: **0.9276**
* **PR-AUC**: **0.8851**
* **Holdout F1-Score**: **0.8428**
* **Brier Score**: **0.1064**

---

## 5. Explainable AI: Saabas Tree-Path Decomposition

For every individual coordinate and regional risk zone, LRIDS computes exact local feature attributions using Saabas marginal decision-tree path decomposition:

$$\text{Risk}(\mathbf{x}) = \text{BaseRate} + \sum_{j=1}^{M} \Delta_j(\mathbf{x})$$

Where $\Delta_j(\mathbf{x})$ represents the directional shift in risk probability attributed to feature $j$ as the sample traverses internal decision nodes. This guarantees that emergency managers are never presented with an unverified black-box number; every alert is backed by explicit factors:
* *Antecedent Rainfall ($API_{72}$): +28.4%*
* *Factor of Safety ($F_s = 0.88$): +24.1%*
* *Slope Gradient ($38.5^\circ$): +18.2%*
* *Canopy Root Cohesion (Dense Forest): -7.5%*\n