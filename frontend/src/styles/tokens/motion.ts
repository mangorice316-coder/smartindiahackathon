/**
 * C2 Tactical Mission-Control Design Tokens - Motion & Transition
 * Fast, deliberate micro-animations adhering to prefers-reduced-motion.
 */

export const motion = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    pulse: '2000ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
} as const;

export type MotionTokens = typeof motion;
