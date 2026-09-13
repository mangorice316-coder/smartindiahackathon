# LRIDS Accessibility Architecture & WCAG 2.1 AA Compliance

## 1. Compliance Baseline
LRIDS is built to comply with **WCAG 2.1 Level AA** across all interactive interfaces. Accessibility is treated as an architectural requirement rather than a post-launch audit item.

---

## 2. Keyboard Navigation Standards

### Global Navigation Shortcuts
| Key Combination | Scope | Action |
| :--- | :--- | :--- |
| `Ctrl + K` or `Cmd + K` | Global | Toggles Command Palette |
| `/` | Global (outside inputs) | Focuses Command Palette search input |
| `Escape` | Modals & Drawers | Closes active dialog, returns focus to trigger |
| `Tab` / `Shift + Tab` | Modals & Drawers | Traps focus cyclically inside dialog bounds |
| `Enter` / `Space` | Buttons & Rows | Activates focused interactive control |

### Focus Management (`src/hooks/useFocusTrap.ts`)
- **Dialog Opening**: Focus automatically shifts to the first focusable interactive element inside the modal or drawer.
- **Focus Trapping**: Tab navigation is trapped within the open modal to prevent keyboard users from inadvertently navigating underlying background elements.
- **Dialog Closing**: When a modal or drawer unmounts or is dismissed via `Escape`, focus is restored directly to the DOM element that originally triggered the dialog.
- **Visible Focus Rings**: All interactive controls implement `focus-visible:ring-2 focus-visible:ring-c2-cyan-400 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`.

---

## 3. Screen Reader Landmarks & Semantic Hierarchy

### Landmark Mapping
- `<header role="banner">`: Persistent status bar and C2 top navigation.
- `<nav role="navigation">`: Left sidebar navigation rail and mobile bottom navigation.
- `<main id="main-content" tabIndex={-1}>`: Dedicated main content region accessible via the skip link.
- `<section>`: Major feature panels (e.g. Incident Overview, Core Analytics).
- `dialog[aria-modal="true"]`: Modals and drawers with `aria-labelledby` linking to the dialog title and `aria-describedby` linking to the dialog description.

### Skip Navigation
A hidden-until-focused skip link is positioned as the very first element in `AppLayout.tsx`:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-3 focus:bg-c2-cyan-500 focus:text-slate-950 focus:font-bold focus:shadow-xl focus:outline-none"
>
  Skip to main content
</a>
```

---

## 4. Contrast Ratios & Visual Perception
- **Text Contrast**: Primary body text (`#F9FAFB`) against deep slate background (`#0B0F19`) provides a **16.8:1 contrast ratio**, well exceeding the 4.5:1 WCAG AA requirement.
- **Secondary Text**: Metadata text (`#9CA3AF`) against slate (`#0B0F19`) provides a **7.2:1 contrast ratio**.
- **Non-Color Dependence**: Meaning is never communicated through color alone. Every status, alert, and badge couples a semantic color with a descriptive icon (`AlertTriangle`, `CheckCircle2`, `AlertCircle`) and explicit text label (`CRITICAL`, `WARNING`, `STABLE`).

---

## 5. Motion & Vestibular Safety (`prefers-reduced-motion`)
All animated pulse indicators, transitions, and loading shimmers respect user operating system settings. When `prefers-reduced-motion: reduce` is active:
- CSS animations and keyframe loops are deactivated or simplified to instant opacity shifts.
- Infinite radar sweeps and ping animations remain static.
