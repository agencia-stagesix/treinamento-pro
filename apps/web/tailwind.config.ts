import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System — App Treinamento Pro (spec section 11.2)
        bg: "#0a0e17",
        card: "#111827",
        border: "#1e293b",
        text: "#e2e8f0",
        dim: "#94a3b8",
        dim2: "#64748b",
        dim3: "#475569",
        cyan: {
          DEFAULT: "#ff5722",
          hover: "#e64a19",
        },
        green: {
          DEFAULT: "#34d399",
          hover: "#10b981",
        },
        amber: {
          DEFAULT: "#fbbf24",
          hover: "#f59e0b",
        },
        red: {
          DEFAULT: "#f87171",
          hover: "#ef4444",
        },
        blue: {
          DEFAULT: "#60a5fa",
        },
        purple: {
          DEFAULT: "#a78bfa",
        },
        pink: {
          DEFAULT: "#f472b6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.5)",
        glow: "0 0 20px rgba(34,211,238,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
