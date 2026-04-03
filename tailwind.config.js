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
        primary: "#1D5C45",
        primaryLight: "#47A876",
        primaryDark: "#16482F",
        bgLight: "#E7F6EE",
        softGreen: "#DEF2E9",
        accentOrange: "#FF9800",
        secondary: "#E7F6EE",
      },
    },
  },
  plugins: [],
};