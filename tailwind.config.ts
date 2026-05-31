import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0f0f10",
          elevated: "#161618",
          subtle: "#1c1c1f",
        },
        fg: {
          DEFAULT: "#e6e6e6",
          muted: "#8a8a8a",
          subtle: "#5a5a5a",
        },
        accent: {
          DEFAULT: "#a78bfa",
          soft: "#c4b5fd",
        },
        key: {
          white: "#f5f5f4",
          whiteEdge: "#d6d3d1",
          whiteActive: "#d8c8ff",
          black: "#1a1a1d",
          blackEdge: "#2a2a2e",
          blackActive: "#5b4b86",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        keyWhite: "inset 0 -6px 0 0 rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.35)",
        keyBlack: "inset 0 -4px 0 0 rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
