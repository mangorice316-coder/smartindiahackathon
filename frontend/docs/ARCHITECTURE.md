# LRIDS UI System Architecture & Engineering Standards

## 1. Overview
The Landslide Risk Intelligence & Early Warning System (LRIDS) user interface is engineered as a mission-critical tactical Command & Control (C2) operational environment. It follows a feature-oriented, modular, accessible, testable, and maintainable architecture designed to be maintained by multi-disciplinary teams over years of operation.

---

## 2. Core Architectural Principles
1. **Single Responsibility**: Every component, hook, service, and token module has one reason to exist.
2. **Explicit Interfaces**: All props and contracts are strictly typed using TypeScript interfaces; no implicit or arbitrary `any`.
3. **Predictable State Management**: Minimal global state. High-frequency local state stays local; cross-cutting operational state is segregated into focused contexts (`AppContext`, `NotificationContext`, `FilterContext`).
4. **Feature Isolation**: Features operate inside self-contained bounded contexts (`src/features/`) exporting public APIs via barrel `index.ts`.
5. **Standardized Data Fetching**: Universal 7-state lifecycle machine (`idle` | `loading` | `success` | `refreshing` | `empty` | `error` | `stale`) managed via `useAsyncData`.
6. **Accessible by Default**: Full compliance with WCAG 2.1 AA standards including keyboard navigation, focus trapping, semantic markup, and contrast thresholds.
7. **Fault Isolation**: Granular Error Boundaries at Application, Route, and Feature boundaries prevent cascading view failures.

---

## 3. Directory Topology & Layer Hierarchy

```
frontend/
├── docs/                        # Synchronized system documentation
│   ├── ARCHITECTURE.md          # Architecture & engineering guidelines
│   ├── COMPONENTS.md            # Reusable UI component catalog & API reference
│   ├── DEPENDENCY_GOVERNANCE.md # Third-party dependency evaluations & rationale
│   └── ACCESSIBILITY.md         # WCAG 2.1 AA accessibility matrix & audit
│
├── tests/                       # Automated test suites
│   ├── setup.ts                 # Vitest & Testing Library configuration
│   ├── unit/                    # Unit tests for tokens, hooks, formatters, primitives
│   └── integration/             # Integration tests for critical user workflows
│
├── src/
│   ├── app/                     # Application Shell & Orchestration
│   │   ├── config/              # Feature flags & environment config
│   │   ├── layouts/             # AppLayout shell (Header, Sidebar, Modals, Skip link)
│   │   ├── providers/           # AppProviders root context tree
│   │   ├── routes/              # AppRouter view coordinator with error boundaries
│   │   └── App.tsx              # Clean root entry orchestrator (< 200 lines)
│   │
│   ├── components/              # Shared, domain-agnostic UI building blocks
│   │   ├── ui/                  # Atomic primitives (Button, Badge, Card, Input, Modal, etc.)
│   │   ├── feedback/            # Feedback components (Alert, EmptyState, ErrorBoundary)
│   │   ├── navigation/          # Navigation components (Header, Sidebar, CommandPalette, etc.)
│   │   └── data-display/        # Telemetry & metric displays (KpiCard, DataTable, etc.)
│   │
│   ├── features/                # Self-contained domain feature slices
│   │   ├── situation-room/      # C2 overview dashboard & incident hero
│   │   ├── risk-map/            # GIS Leaflet canvas, satellite & route overlays
│   │   ├── live-conditions/     # Sensor telemetry streams & rain gauges
│   │   ├── infrastructure/      # Critical lifelines & asset vulnerability
│   │   ├── exposure/            # Population density & element-at-risk analysis
│   │   ├── alerts/              # Active warning notifications & acknowledgments
│   │   ├── simulation/          # Geotechnical stability & rainfall triggers
│   │   ├── historical-analysis/ # Disaster event catalog, timeline player & trends
│   │   ├── inspections/         # Field task triage & verification workflow
│   │   ├── sensors/             # Physical telemetry node health & battery life
│   │   ├── model-data/          # ML weights, feature schema & xAI explainability
│   │   ├── data-engine/         # Multi-tier ingest pipelines & lineage
│   │   ├── reports/             # Automated situation reports & exports
│   │   ├── audit-logs/          # SHA-256 immutable action audit trail
│   │   └── settings/            # Risk thresholds & operational modes
│   │
│   ├── hooks/                   # Reusable React hooks
│   │   ├── useAsyncData.ts      # Standardized 7-state data fetching
│   │   ├── useFocusTrap.ts      # Modal & drawer WCAG focus trap
│   │   ├── useKeyboardShortcut.ts # Global keybinding listener (Ctrl+K, Esc, /)
│   │   └── useMediaQuery.ts     # Responsive breakpoint listeners
│   │
│   ├── services/                # API clients, logging & persistence
│   │   ├── api.ts               # Typed REST client for FastAPI backend
│   │   ├── auditLogger.ts       # Action audit trail service
│   │   ├── offlineCache.ts      # LocalStorage & Cache API manager
│   │   └── mockData.ts          # Offline failover fixtures
│   │
│   ├── state/                   # Context-based state management
│   │   ├── AppContext.tsx       # System status, active location, data mode
│   │   ├── NotificationContext.tsx # C2 alert notifications & unread counts
│   │   └── FilterContext.tsx    # Multi-parameter hazard filters
│   │
│   ├── styles/
│   │   ├── tokens/              # Single source of truth for design tokens
│   │   └── index.css            # Tactical CSS variables & Tailwind directives
│   │
│   └── types/
│       └── index.ts             # Domain type contracts
```

### Strict Dependency Direction
```
APP SHELL (src/app)
      ↓
FEATURES (src/features)
      ↓
SHARED COMPONENTS (src/components)
      ↓
ATOMIC PRIMITIVES & TOKENS (src/components/ui, src/styles/tokens)
```
*Rule: Lower architectural layers MUST NEVER import from higher layers.*

---

## 4. State Management Architecture
- **AppContext**: Holds global system status (`OPERATIONAL`, `DEGRADED`, `CRITICAL`, `OFFLINE`), active location selection (`selectedLocationId`), data mode (`DEMO` vs `REAL`), and sync timestamps.
- **NotificationContext**: Manages real-time tactical warnings, notification read/unread statuses, and critical counters.
- **FilterContext**: Manages user-configured filter parameters across hazard assessments, map overlays, and inspections.
- **Local Feature State**: Kept strictly inside the feature component or feature hook.

---

## 5. Data Fetching & Lifecycle Conventions
Data fetching is standardized using `useAsyncData<T>`:
```ts
const {
  data,
  status, // 'idle' | 'loading' | 'success' | 'refreshing' | 'empty' | 'error' | 'stale'
  error,
  isLoading,
  isRefreshing,
  isEmpty,
  isError,
  isStale,
  execute,
  refresh,
} = useAsyncData(fetchFn, {
  autoFetch: true,
  staleTime: 60000,
});
```

---

## 6. Error Boundary Hierarchy
1. **Application Level**: Catches fatal shell rendering failures.
2. **Route / View Level**: Each view in `AppRouter.tsx` is wrapped in an `<ErrorBoundary level="feature">`. If a chart in Historical Analysis fails, the rest of the application remains completely operational, and the user receives a "Recover Module" button.
3. **Component Level**: Optional wrapper around third-party GIS or WebGL canvases.
