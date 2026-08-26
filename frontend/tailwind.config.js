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
          50: '#f0f4f8',
          100: '#dbe3ed',
          200: '#bdcbdd',
          300: '#90a9c8',
          400: '#5e82ae',
          500: '#3e6290',
          600: '#304d73',
          700: '#283e5c',
          800: '#1b293e',
          950: '#0b131f', // Command center deep navy
        },
      },
    },
  },
  plugins: [],
}
