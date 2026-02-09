/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'md3-surface': '#FEF7FF',
        'md3-surface-container': '#F3EDF7',
        'md3-primary': '#6750A4',
        'md3-primary-container': '#EADDFF',
        'md3-on-primary': '#FFFFFF',
        'md3-on-surface': '#1D1B20',
        'md3-on-surface-variant': '#49454F',
        'md3-outline': '#79747E',
      },
      borderRadius: {
        'md3-lg': '24px',
        'md3-md': '16px',
        'md3-sm': '12px',
        'md3-full': '9999px',
      },
      spacing: {
        'sidebar': '320px',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}