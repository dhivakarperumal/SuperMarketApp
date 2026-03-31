/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: "#2E7D32",
        primaryLight: "#66BB6A",
        primaryDark: "#1B5E20",
        bgLight: "#F1F8E9",
        softGreen: "#E8F5E9",
        accentOrange: "#FF9800",
        secondary: "#F1F8E9",
      },
    },
  },
  plugins: [],
};