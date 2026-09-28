import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          paper: "#FFFFFF",
          canvas: "#F1F5F9",
          mist: "#CBD5E1",
          slate: "#64748B",
          ink: "#0F172A",
        },
        fire: {
          DEFAULT: "#0F172A",
          dark: "#020617",
        },
        // Enquiry CTAs only. Reserved for actions that start a sales conversation,
        // so a conversion action never looks like ordinary navigation.
        ember: {
          DEFAULT: "#C2410C",
          light: "#EA580C",
          dark: "#9A3412",
        },
      },
    },
  },
  plugins: [],
};

export default config;
