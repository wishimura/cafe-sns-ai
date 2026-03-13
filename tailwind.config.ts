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
        brand: {
          50: "#fdf8f0",
          100: "#f9eddb",
          200: "#f3d9b5",
          300: "#eabd85",
          400: "#e09a53",
          500: "#d88132",
          600: "#c96a27",
          700: "#a75222",
          800: "#864222",
          900: "#6d381e",
          950: "#3a1b0e",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
