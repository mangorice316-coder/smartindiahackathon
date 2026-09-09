/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#090d16",
        surface: {
          DEFAULT: "#111827",
          hover: "#1f293d",
          elevated: "#1a2234"
        },
        border: {
          subtle: "rgba(51, 65, 85, 0.4)",
          highlight: "rgba(0, 229, 255, 0.3)"
        },
        signal: {
          cyan: "#00e5ff",
          emerald: "#10b981",
          amber: "#f59e0b",
          orange: "#f97316",
          rose: "#ef4444"
        },
        hazard: {
          low: "#10b981",
          moderate: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444"
        }
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
