/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          950: "#070B12",
          900: "#0B1018",
          DEFAULT: "#070B12",
        },
        surface: {
          900: "#10151F",
          800: "#151B26",
          700: "#1B2332",
          hover: "#1E2738",
          elevated: "#151B26",
          DEFAULT: "#10151F",
        },
        c2: {
          border: "#253042",
          borderSubtle: "rgba(37, 48, 66, 0.6)",
          borderHighlight: "rgba(37, 199, 232, 0.4)",
          textPrimary: "#F5F7FA",
          textSecondary: "#A9B4C4",
          textMuted: "#718096",
        },
        semantic: {
          success: "#20C997",
          info: "#25C7E8",
          warning: "#F2B84B",
          danger: "#EF4444",
          critical: "#FF3B4D",
          accent: "#8B7CFF",
        },
        signal: {
          cyan: "#25C7E8",
          emerald: "#20C997",
          amber: "#F2B84B",
          orange: "#F97316",
          rose: "#EF4444",
          critical: "#FF3B4D",
          purple: "#8B7CFF",
        },
        hazard: {
          low: "#20C997",
          moderate: "#F2B84B",
          high: "#F97316",
          critical: "#FF3B4D",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Space Grotesk'", "'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'c2-sm': '6px',
        'c2-md': '10px',
        'c2-lg': '14px',
        'c2-dialog': '16px',
      },
      boxShadow: {
        'c2-glow-cyan': '0 0 20px -3px rgba(37, 199, 232, 0.25)',
        'c2-glow-critical': '0 0 20px -3px rgba(255, 59, 77, 0.3)',
        'c2-glow-warning': '0 0 20px -3px rgba(242, 184, 75, 0.25)',
        'c2-glow-success': '0 0 20px -3px rgba(32, 201, 151, 0.25)',
        'c2-card': '0 4px 24px -1px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(37, 48, 66, 0.8)',
      },
    },
  },
  plugins: [],
};
