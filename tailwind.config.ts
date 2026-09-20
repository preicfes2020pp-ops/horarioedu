import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2430",
        muted: "#5B6270",
        surface: "#F5F7FB",
        card: "#FFFFFF",
        border: "#E2E5EA",
        brand: {
          50: "#EAF0FB",
          100: "#D2E0F7",
          400: "#3B82F6",
          600: "#1E40AF",
          700: "#173882",
        },
        accent: {
          teal: "#10B981",
          amber: "#F59E0B",
          coral: "#D85A30",
          purple: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
