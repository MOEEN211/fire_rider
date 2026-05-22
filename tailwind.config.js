/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: '#74e34a',
        ink: '#101510',
      },
      boxShadow: {
        paper: '0 25px 80px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
