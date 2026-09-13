/**
 * C2 Tactical Mission-Control Design Tokens - Responsive Breakpoints
 * Mobile-first media query thresholds.
 */

export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
  ultraWide: '1920px',
} as const;

export type BreakpointTokens = typeof breakpoints;
