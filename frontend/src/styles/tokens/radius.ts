/**
 * C2 Tactical Mission-Control Design Tokens - Border Radii
 * Precise, subtle curves maintaining high-tech military hardware feel.
 */

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export type RadiusTokens = typeof radius;
