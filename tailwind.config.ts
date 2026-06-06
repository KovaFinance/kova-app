import type { Config } from "tailwindcss";

// The Volt Dark design system lives in app/globals.css (CSS variables + classes).
// These tokens mirror it so any Tailwind utility usage stays on-palette.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: "#070707",
        screen: "#0A0A0A",
        surface: "#111111",
        surface2: "#171717",
        elev: "#1C1C1C",
        accent: "#C8F135",
        accent2: "#A9D119",
        ink: "#0A0A0A",
        negative: "#FF6B5C",
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "16px",
        lg: "22px",
      },
    },
  },
  plugins: [],
};
export default config;
