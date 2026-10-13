/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dku-blue': '#003366',
        'dku-blue-light': '#004488',
        'dku-blue-dark': '#002244',
        'dku-green': '#6DAA4A',
        'dku-green-light': '#7DC455',
        'dku-green-dark': '#5A9038',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
