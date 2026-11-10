/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1B2F5A',
          800: '#233d73',
          700: '#2b4b8c'
        },
        crimson: {
          600: '#E52629',
          700: '#cc2124'
        }
      }
    },
  },
  plugins: [],
}
