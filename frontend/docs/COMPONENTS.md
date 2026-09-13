# LRIDS Design System Component Catalog & API Reference

This catalog documents the reusable components of the LRIDS Design System according to the standards outlined in Section 7 & 33 of the Master UI Specification.

---

## 1. Button

### Purpose
Interactive trigger for actions, submissions, navigation actions, or modal openings.

### When to Use
- Triggering an action (e.g., "Deploy Team", "Acknowledge Alert", "Run Simulation").
- Submitting a form or dialog action.

### When NOT to Use
- Navigating between browser URLs or primary pages (use semantic `<a>` or routing links unless styling as a button).

### Props / API
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'warning' \| 'ghost' \| 'outline'` | `'primary'` | Visual intent and importance |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding and font scale |
| `isLoading` | `boolean` | `false` | Displays spinner, disables clicks, sets `aria-busy="true"` |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon positioned before label |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon positioned after label |
| `fullWidth` | `boolean` | `false` | Stretches to 100% of container width |
| `disabled` | `boolean` | `false` | Native disabled state |

### States
- **Default**: Styled per variant with crisp contrast.
- **Hover**: Subtle brightness / background shift.
- **Pressed / Active**: Minor scale compression and border darkening.
- **Focus**: High-contrast `focus-visible:ring-2 focus-visible:ring-c2-cyan-400`.
- **Disabled**: 50% opacity, pointer events disabled.
- **Loading**: Replaces left icon with animated spinner, sets `aria-busy="true"`.

### Accessibility Requirements
- Semantic `<button>` element.
- Visible focus indicator on keyboard tab navigation.
- Minimum touch target size >= 44x44px for mobile/tablet (`min-h-[34px]` to `min-h-[48px]`).

### Usage Example
```tsx
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';

<Button
  variant="primary"
  size="sm"
  leftIcon={<Send className="w-3.5 h-3.5" />}
  onClick={handleDeploy}
>
  Deploy Response Team
</Button>
```

---

## 2. Badge

### Purpose
Compact status and category indicator for operational telemetry, severity, and urgency.

### When to Use
- Displaying alert severity (`CRITICAL`, `WARNING`, `INFO`).
- Indicating location risk levels (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
- Live system status (`LIVE`, `SYNCED`, `OFFLINE`).

### When NOT to Use
- Long descriptive paragraphs or actionable buttons (use `Button` or `Alert` instead).

### Props / API
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'critical' \| 'high' \| 'warning' \| 'moderate' \| 'low' \| 'success' \| 'info' \| 'purple' \| 'neutral'` | `'neutral'` | Semantic color tone |
| `size` | `'xs' \| 'sm' \| 'md'` | `'sm'` | Size scale |
| `dot` | `boolean` | `false` | Displays a status circle indicator |
| `pulse` | `boolean` | `false` | Pulses the dot indicator for real-time live events |
| `icon` | `React.ReactNode` | `undefined` | Optional leading icon |

### Usage Example
```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="critical" dot pulse>
  FS 0.88 CRITICAL
</Badge>
```

---

## 3. Card

### Purpose
Structural container for grouping related data, KPI metrics, charts, or feature workflows.

### When to Use
- Framing dashboard panels, KPI metrics, inspection tasks, and map layers.

### Props / API
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'elevated' \| 'interactive' \| 'bordered' \| 'cyan' \| 'amber' \| 'red'` | `'default'` | Elevation and border accent |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Inner spacing |
| `header` | `React.ReactNode` | `undefined` | Optional top header bar |
| `footer` | `React.ReactNode` | `undefined` | Optional bottom status bar |

### Usage Example
```tsx
import { Card } from '@/components/ui/Card';

<Card variant="interactive" onClick={handleSelect}>
  <h4 className="text-sm font-bold text-white">Chooralmala Scarp</h4>
  <p className="text-xs text-slate-400">Pore pressure: 68.4 kPa</p>
</Card>
```

---

## 4. Modal & Drawer

### Purpose
Modal dialogs (`Modal`) and slide-in side panels (`Drawer`) for focused tasks, detailed investigations, and multi-parameter filters.

### Accessibility Requirements
- Focus trapping inside open dialog (`useFocusTrap`).
- Escape key automatically closes dialog.
- Background scrolling is disabled when open.
- Focus is automatically restored to the triggering element upon closure.
- Semantic ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.

### Usage Example
```tsx
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Evacuation Authorization"
  description="Confirm deployment of mandatory evacuation order for Sector 4."
  footer={
    <div className="flex gap-2">
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleConfirm}>Authorize Evacuation</Button>
    </div>
  }
>
  <p className="text-xs text-slate-300">Factor of Safety has breached critical threshold.</p>
</Modal>
```

---

## 5. Alert

### Purpose
Displays high-visibility operational feedback, warning banners, and error notices.

### When to Use
- Announcing critical telemetry threshold breaches.
- Showing connectivity disruptions or offline failover notices.

### Props / API
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `severity` | `'critical' \| 'warning' \| 'info' \| 'success'` | `'info'` | Alert severity tier |
| `title` | `string` | **required** | Concise summary of the alert |
| `description` | `string` | `undefined` | Explanatory context |
| `onDismiss` | `() => void` | `undefined` | Optional dismiss handler |
| `action` | `{ label: string; onClick: () => void }` | `undefined` | Action button |

---

## 6. EmptyState

### Purpose
Deliberate, constructive empty state when data collections or search results return zero items.

### Requirements
1. **What happened**: "No Active Alerts Found"
2. **Why**: "All sensors in this sector report normal equilibrium."
3. **Next Step**: Action button (e.g. "Reset Filters" or "Adjust Thresholds").

---

## 7. ErrorBoundary

### Purpose
Prevents application crashes by catching React rendering exceptions at route, feature, or component boundaries.

### Features
- User-facing recovery action ("Recover Module" / "Retry").
- Expandable diagnostic view with stack trace for engineering review.
- Telemetry error reporting integration.
