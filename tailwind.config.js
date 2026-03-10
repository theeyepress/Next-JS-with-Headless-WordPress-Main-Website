/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#a41e22",    // Logo main red
        secondary: "#701413",  // Darker red for hover
        accent: "#000000",     // Black for text/background if needed
        bgHeader: "#a41e22",   // Header background
        textHeader: "#ffffff", // White text
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};