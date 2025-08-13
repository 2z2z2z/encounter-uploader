/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { DEFAULT: '800px' , '2xl': '120rem' },
    },
    extend: {
      borderRadius: {
        full: '9999px',
        lg: '12px',
      }
    },
  },
  plugins: [],
}
