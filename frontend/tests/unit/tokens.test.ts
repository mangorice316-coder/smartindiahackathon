import { describe, it, expect } from 'vitest';
import { colors, typography, spacing, radius, shadows, breakpoints, motion } from '../../src/styles/tokens';

describe('Design Tokens - Single Source of Truth', () => {
  it('should define core semantic status colors with contrast triplets', () => {
    expect(colors.status.critical.border).toBe('#EF4444');
    expect(colors.status.high.border).toBe('#F97316');
    expect(colors.status.warning.border).toBe('#F59E0B');
    expect(colors.status.moderate.border).toBe('#EAB308');
    expect(colors.status.success.border).toBe('#10B981');
    expect(colors.status.info.border).toBe('#00F0FF');
    expect(colors.status.simulation.border).toBe('#A855F7');
  });

  it('should define dual font system with monospace telemetry font', () => {
    expect(typography.fonts.mono).toContain('JetBrains Mono');
    expect(typography.fonts.sans).toContain('Inter');
    expect(typography.scale.display.fontSize).toBe('2rem');
    expect(typography.scale.caption.fontSize).toBe('0.6875rem');
  });

  it('should enforce 4px base spacing scale without arbitrary values', () => {
    expect(spacing[1]).toBe('0.25rem');
    expect(spacing[2]).toBe('0.5rem');
    expect(spacing[4]).toBe('1rem');
    expect(spacing[8]).toBe('2rem');
  });

  it('should define mobile-first responsive breakpoints', () => {
    expect(breakpoints.tablet).toBe('768px');
    expect(breakpoints.desktop).toBe('1024px');
    expect(breakpoints.wide).toBe('1440px');
  });

  it('should provide tactical neon glow shadow tokens', () => {
    expect(shadows.glowCyan).toContain('rgba(0, 240, 255');
    expect(shadows.glowRed).toContain('rgba(239, 68, 68');
  });

  it('should define motion tokens supporting reduced-motion scenarios', () => {
    expect(motion.duration.instant).toBe('0ms');
    expect(motion.duration.fast).toBe('150ms');
    expect(motion.duration.normal).toBe('250ms');
  });
});
