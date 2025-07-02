/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // QUAN TRỌNG: để chuyển dark bằng class .dark
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwind-scrollbar-hide')],
}
