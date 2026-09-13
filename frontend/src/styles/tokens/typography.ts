/**
 * C2 Tactical Mission-Control Design Tokens - Typography
 * Dual-font system: UI Sans for clear readability, Monospace for sensor telemetry & C2 metrics.
 */

export const typography = {
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  scale: {
    display: {
      fontSize: '2rem',       // 32px
      lineHeight: '2.5rem',   // 40px
      letterSpacing: '-0.025em',
      fontWeight: '700',
    },
    h1: {
      fontSize: '1.5rem',     // 24px
      lineHeight: '2rem',     // 32px
      letterSpacing: '-0.02em',
      fontWeight: '700',
    },
    h2: {
      fontSize: '1.25rem',    // 20px
      lineHeight: '1.75rem',  // 28px
      letterSpacing: '-0.015em',
      fontWeight: '600',
    },
    h3: {
      fontSize: '1.125rem',   // 18px
      lineHeight: '1.5rem',   // 24px
      letterSpacing: '-0.01em',
      fontWeight: '600',
    },
    h4: {
      fontSize: '1rem',       // 16px
      lineHeight: '1.5rem',   // 24px
      letterSpacing: '0',
      fontWeight: '600',
    },
    bodyLarge: {
      fontSize: '1.125rem',   // 18px
      lineHeight: '1.75rem',  // 28px
      letterSpacing: '0',
      fontWeight: '400',
    },
    body: {
      fontSize: '0.875rem',   // 14px
      lineHeight: '1.25rem',  // 20px
      letterSpacing: '0',
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: '0.75rem',    // 12px
      lineHeight: '1rem',     // 16px
      letterSpacing: '0.01em',
      fontWeight: '400',
    },
    caption: {
      fontSize: '0.6875rem',  // 11px
      lineHeight: '0.875rem', // 14px
      letterSpacing: '0.02em',
      fontWeight: '500',
    },
    overline: {
      fontSize: '0.625rem',   // 10px
      lineHeight: '0.75rem',  // 12px
      letterSpacing: '0.08em',
      fontWeight: '700',
      textTransform: 'uppercase',
    },
  },
} as const;

export type TypographyTokens = typeof typography;
