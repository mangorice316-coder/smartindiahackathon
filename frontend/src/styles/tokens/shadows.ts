/**
 * C2 Tactical Mission-Control Design Tokens - Shadows & Elevation
 * High-definition ambient dark mode shadows with tactical neon glows.
 */

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.6)',
  glowCyan: '0 0 15px rgba(0, 240, 255, 0.35)',
  glowAmber: '0 0 15px rgba(245, 158, 11, 0.35)',
  glowRed: '0 0 15px rgba(239, 68, 68, 0.45)',
  glowEmerald: '0 0 15px rgba(16, 185, 129, 0.35)',
  glowPurple: '0 0 15px rgba(168, 85, 247, 0.35)',
} as const;

export type ShadowTokens = typeof shadows;
