import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#FFF8EE",
        sun: "#FFD23F",
        coral: "#FF5C39",
        kgreen: "#0B6E4F",
        kgreenink: "#063b2b",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        hard: "5px 5px 0 0 #111111",
        hardlg: "8px 8px 0 0 #111111",
        hardsun: "5px 5px 0 0 #FFD23F",
      },
      borderWidth: { 3: "3px" },
    },
  },
  plugins: [],
};
export default config;
