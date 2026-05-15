import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cta: "#3b82f6",
        "accent-orange": "#f97316",
        "accent-red": "#ef4444",
        "accent-green": "#22c55e",
        primary: "#111827",
        secondary: "#6b7280",
        background: "#f9fafb",
      },
    },
  },
  plugins: [],
};

export default config;
