# LRIDS Third-Party Dependency Governance & Audit Records

In accordance with Section 40 & 41 of the Master UI Rebuild Specification, all dependencies in the LRIDS application are audited for runtime performance, bundle size, security, tree-shaking, and replacement contingency.

---

## 1. Runtime Dependencies

### `react` & `react-dom` (^18.3.1)
- **Purpose**: Core component rendering engine and declarative UI model.
- **Alternatives Considered**: Vue, Svelte, Solid.
- **Justification**: Industry-standard component architecture with robust concurrent rendering, mature accessibility ecosystem, and deep TypeScript support.
- **Bundle Impact**: ~42 kB (gzipped).
- **License**: MIT.
- **Replacement Plan**: Core architectural foundation; long-term support committed by React core team.

### `lucide-react` (^0.439.0)
- **Purpose**: Lightweight, consistent, tree-shakeable SVG icon system for tactical C2 telemetry, status indicators, and navigation.
- **Alternatives Considered**: `react-icons`, `@heroicons/react`.
- **Justification**: Modern ESM tree-shaking ensures only imported icons are bundled (average < 1 kB per icon). Crisp, readable lines at 14px–20px scales.
- **Bundle Impact**: ~15 kB (tree-shaken across app).
- **License**: ISC.
- **Replacement Plan**: Easily swappable with custom SVGs or alternative icon libraries via standard icon prop interfaces.

### `leaflet` (^1.9.4) & `@types/leaflet`
- **Purpose**: High-performance interactive geospatial GIS mapping for risk heatmaps, sensor nodes, and road vulnerability traces.
- **Alternatives Considered**: Mapbox GL JS, OpenLayers.
- **Justification**: Open-source, light footprint, completely offline-compatible with local raster/vector tile servers, zero proprietary token requirements.
- **Bundle Impact**: ~42 kB (gzipped).
- **License**: BSD-2-Clause.
- **Replacement Plan**: Encapsulated behind `RiskMapCanvas` and `HistoricalEventMap` feature components; could be swapped with OpenLayers or MapLibre if 3D terrain rendering is needed.

### `clsx` (^2.1.1) & `tailwind-merge` (^2.5.2)
- **Purpose**: Utility for conditional CSS class composition and deterministic Tailwind conflict resolution.
- **Alternatives Considered**: Manual template strings, `classnames`.
- **Justification**: Negligible bundle footprint (< 2 kB total), eliminates class name collision bugs in reusable UI primitives.
- **Bundle Impact**: ~1.8 kB (gzipped).
- **License**: MIT.
- **Replacement Plan**: Simple internal helper function if needed.

---

## 2. Developer & Test Dependencies

### `vitest` (^2.1.8)
- **Purpose**: Vite-native fast unit and integration test runner.
- **Justification**: Instant HMR, shares Vite configuration, native TypeScript transformation, 10x faster execution than legacy Jest.
- **Bundle Impact**: 0 kB (dev only).

### `@testing-library/react` & `@testing-library/jest-dom`
- **Purpose**: User-centric DOM testing utilities for verifying component behavior, keyboard interactions, and accessibility attributes.
- **Bundle Impact**: 0 kB (dev only).

### `tailwindcss` (^3.4.10), `postcss`, `autoprefixer`
- **Purpose**: Compile design tokens and utility classes into optimized CSS.
- **Bundle Impact**: Production CSS is fully purged to ~14 kB (gzipped).
- **License**: MIT.

---

## 3. Dependency Policy Rules
1. **Zero Unjustified Dependencies**: No library may be added merely to save fewer than 50 lines of code.
2. **Mandatory Tree-Shaking**: All new UI libraries must support ESM tree-shaking.
3. **No Heavy CSS Framework Overrides**: UI primitives must use standard design tokens and Tailwind utility composition.
4. **Security Audits**: Regular execution of `npm audit` on CI pull requests.
