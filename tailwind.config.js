/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gwinnett: {
          dark: '#0a1128',
          navy: '#0B2545',
          blue: '#134074',
          slate: '#1e293b',
          teal: '#007074',
          emerald: '#10b981',
          gold: '#EEB902',
          amber: '#f59e0b',
          crimson: '#D90429',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      }
    },
  },
  plugins: [],
}
