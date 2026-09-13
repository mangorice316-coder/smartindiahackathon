/**
 * Centralized Design Token System (Single Source of Truth)
 * Implements Section 8, 9, 10, 11, 35 of the Master UI Rebuild Specification.
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './breakpoints';
export * from './motion';

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { breakpoints } from './breakpoints';
import { motion } from './motion';

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  breakpoints,
  motion,
} as const;

export default tokens;
