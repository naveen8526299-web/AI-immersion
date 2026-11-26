/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#060818',
          900: '#0a0f2c',
          800: '#11183c',
          700: '#1a2352',
        },
        electric: {
          400: '#38bdf8',
          500: '#3b82f6',
          600: '#2563eb',
        },
        cosmic: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          900: '#3b0764',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'cosmic-drift': 'cosmicDrift 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 18px rgba(56, 189, 248, 0.25)' },
          '50%': { boxShadow: '0 0 32px rgba(168, 85, 247, 0.5)' },
        },
        cosmicDrift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
};
