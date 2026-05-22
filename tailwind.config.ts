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
        // Apple color system
        apple: {
          blue: "#0071e3",
          "blue-link": "#0066cc",
          "blue-dark": "#2997ff",    // links on dark backgrounds
          black: "#000000",
          "near-black": "#1d1d1f",
          gray: "#f5f5f7",
          "gray-mid": "#d2d2d7",
          "gray-dark": "#86868b",
          white: "#ffffff",
          overlay: "rgba(210,210,215,0.64)",
          "btn-active": "#ededf2",
          "btn-light": "#fafafc",
          "dark-surface": "#272729",
        },
        // Status colors (functional, not decorative)
        status: {
          available: "#34c759",
          sold: "#ff3b30",
          reserved: "#ff9500",
          discussion: "#0071e3",
          upcoming: "#86868b",
        },
      },
      fontFamily: {
        // SF Pro system font stack — picks up SF Pro on Apple devices
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        // Apple type scale
        "display": ["3.5rem", { lineHeight: "1.07", letterSpacing: "-0.28px", fontWeight: "600" }],
        "heading": ["2.5rem", { lineHeight: "1.10", letterSpacing: "-0.02em", fontWeight: "600" }],
        "tile": ["1.75rem", { lineHeight: "1.14", letterSpacing: "0.196px", fontWeight: "400" }],
        "card-title": ["1.31rem", { lineHeight: "1.19", letterSpacing: "0.231px", fontWeight: "700" }],
        "sub": ["1.31rem", { lineHeight: "1.19", letterSpacing: "0.231px", fontWeight: "400" }],
        "body": ["1.0625rem", { lineHeight: "1.47", letterSpacing: "-0.374px" }],
        "body-em": ["1.0625rem", { lineHeight: "1.24", letterSpacing: "-0.374px", fontWeight: "600" }],
        "caption": ["0.875rem", { lineHeight: "1.29", letterSpacing: "-0.224px" }],
        "caption-bold": ["0.875rem", { lineHeight: "1.29", letterSpacing: "-0.224px", fontWeight: "600" }],
        "micro": ["0.75rem", { lineHeight: "1.33", letterSpacing: "-0.12px" }],
      },
      borderRadius: {
        micro: "5px",
        standard: "8px",
        comfortable: "11px",
        large: "12px",
        pill: "980px",
      },
      boxShadow: {
        card: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
        "card-sm": "rgba(0,0,0,0.12) 0px 2px 12px 0px",
        focus: "0 0 0 4px rgba(0,113,227,0.3)",
      },
      backdropBlur: {
        nav: "20px",
      },
      backgroundImage: {
        none: "none",
      },
    },
  },
  plugins: [],
};

export default config;
