import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./artifact/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        sunken: token("sunken"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        accent: { DEFAULT: token("accent"), soft: token("accent-soft"), ink: token("accent-ink") },
        gold: token("gold"),
        ok: { DEFAULT: token("ok"), soft: token("ok-soft") },
        warn: { DEFAULT: token("warn"), soft: token("warn-soft") },
        bad: { DEFAULT: token("bad"), soft: token("bad-soft") },
        chart: { in: token("chart-in"), out: token("chart-out") },
      },
      fontFamily: {
        display: ["var(--font-display)", "Segoe UI", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: { card: "12px" },
      boxShadow: { pop: "0 12px 40px -12px rgb(0 0 0 / 0.28)" },
    },
  },
  plugins: [],
};
export default config;
