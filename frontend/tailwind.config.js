/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0EA5E9",
          light: "#38BDF8",
          dark: "#0284C7",
        },
        bg: {
          DEFAULT: "#0F172A",
          card: "#1E293B",
          border: "#334155",
        },
        text: {
          DEFAULT: "#F1F5F9",
          muted: "#94A3B8",
          dim: "#64748B",
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        accent: "#8B5CF6",
      },
      fontFamily: {
        sans: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
