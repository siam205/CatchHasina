import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        paper: "#f5f1e8",
        coral: "#e76f51",
        mint: "#80b8a8",
        "neon-red": "#ff003c",
        "neon-blue": "#008cff",
        "neon-yellow": "#fff200",
        "neon-green": "#39ff14",
      },
    },
  },
  plugins: [],
};

export default config;
