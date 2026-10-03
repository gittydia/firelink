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
        // Homepage marketing surface only. Catalog and admin stay on `brand`.
        home: {
          navy: "#0D172B",
          navyDeep: "#0A1122",
          text: "#101A2D",
          // Supporting copy on canvas/white (5.28:1, 4.82:1). On navy use `cta`:
          // no single value clears 4.5:1 against both light and dark grounds.
          muted: "#5D6D82",
          cta: "#91A4BD",
          ctaHover: "#778DA8",
          ctaPale: "#D5E0EC",
          supply: "#CAD5E3",
          border: "#52657E",
          iconCircle: "#71839D",
          statusBlue: {
            soft: "#AFCBFA",
            DEFAULT: "#4F8EE8",
            deep: "#1E66C5",
            onSoft: "#0B3F82",
          },
          statusGreen: {
            soft: "#A8E0B2",
            DEFAULT: "#42A85B",
            deep: "#248C3C",
            onSoft: "#14612A",
          },
          statusYellow: {
            soft: "#EEE1B4",
            DEFAULT: "#E7B62F",
            deep: "#DA9A00",
            onSoft: "#7A5200",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
