/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0f0f0f",
        panel:   "#171717",
        border:  "#262626",
        muted:   "#525252",
        accent:  "#f59e0b",        // amber — energy
        robbins: "#3b82f6",        // blue  — Tony
        hormozi: "#10b981",        // green — Alex
        both:    "#8b5cf6",        // purple — combined
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
