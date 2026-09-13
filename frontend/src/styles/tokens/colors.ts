/**
 * C2 Tactical Mission-Control Design Tokens - Colors
 * Strict contrast ratios compliant with WCAG 2.1 AA (>= 4.5:1 for text, >= 3:1 for UI elements).
 */

export const colors = {
  // Base Surface & Canvas Backgrounds
  background: {
    primary: '#0B0F19',    // Deep obsidian
    secondary: '#111827',  // Midnight blue
    tertiary: '#1F2937',   // Surface panel
    elevated: '#283548',   // Popover & modal surface
    canvas: '#06090E',     // Map underlay / absolute dark
  },

  // Borders & Dividers
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: '#374151',
    muted: '#2D3748',
    highlight: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.3)',
  },

  // Text Hierarchy
  text: {
    primary: '#F9FAFB',    // High-contrast primary text
    secondary: '#9CA3AF',  // Technical metadata & subtitles
    tertiary: '#6B7280',   // Captions & disabled labels
    inverse: '#0B0F19',    // Text on high-contrast bright badges
    cyan: '#00F0FF',       // Monospace telemetry accent
    amber: '#F59E0B',      // Warning highlight
    red: '#EF4444',        // Critical alert highlight
    emerald: '#10B981',    // Optimal status highlight
    purple: '#A855F7',     // Simulation highlight
  },

  // Semantic Status Tones (With background, border, text triplets)
  status: {
    critical: {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: '#EF4444',
      text: '#FCA5A5',
      glow: 'rgba(239, 68, 68, 0.4)',
      solid: '#DC2626',
    },
    high: {
      bg: 'rgba(249, 115, 22, 0.15)',
      border: '#F97316',
      text: '#FDBA74',
      glow: 'rgba(249, 115, 22, 0.4)',
      solid: '#EA580C',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.15)',
      border: '#F59E0B',
      text: '#FCD34D',
      glow: 'rgba(245, 158, 11, 0.4)',
      solid: '#D97706',
    },
    moderate: {
      bg: 'rgba(234, 179, 8, 0.15)',
      border: '#EAB308',
      text: '#FDE047',
      glow: 'rgba(234, 179, 8, 0.4)',
      solid: '#CA8A04',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: '#10B981',
      text: '#6EE7B7',
      glow: 'rgba(16, 185, 129, 0.4)',
      solid: '#059669',
    },
    info: {
      bg: 'rgba(0, 240, 255, 0.12)',
      border: '#00F0FF',
      text: '#A5F3FC',
      glow: 'rgba(0, 240, 255, 0.4)',
      solid: '#0891B2',
    },
    simulation: {
      bg: 'rgba(168, 85, 247, 0.15)',
      border: '#A855F7',
      text: '#D8B4FE',
      glow: 'rgba(168, 85, 247, 0.4)',
      solid: '#9333EA',
    },
    neutral: {
      bg: 'rgba(107, 114, 128, 0.15)',
      border: '#6B7280',
      text: '#D1D5DB',
      glow: 'rgba(107, 114, 128, 0.3)',
      solid: '#4B5563',
    },
  },
} as const;

export type ColorTokens = typeof colors;
