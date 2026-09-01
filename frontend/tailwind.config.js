/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          950: '#050609', // Primary background
          900: '#090B10', // Secondary background
          850: '#0D1016', // Surface
          800: '#11151C', // Elevated surface
          750: '#171C26', // Highlight surface
        },
        text: {
          primary: '#F2F3F5',
          secondary: '#9EA4AE',
          muted: '#686F7A',
        },
        steel: {
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Primary cool steel blue accent
          600: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.12)',
          glow: 'rgba(59, 130, 246, 0.20)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.15)',
          steel: 'rgba(59, 130, 246, 0.30)',
        },
        threat: {
          critical: '#DC2626', // Restrained red
          high: '#EA580C',     // Muted orange
          medium: '#D97706',   // Muted amber
          low: '#16A34A',      // Muted green
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'steel-glow': '0 0 30px rgba(59, 130, 246, 0.12)',
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'radial-spotlight': 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.08) 0%, rgba(5, 6, 9, 0) 70%)',
        'subtle-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
