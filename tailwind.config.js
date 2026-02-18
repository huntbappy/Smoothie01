/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.tsx",
    "./constants.tsx",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#f7f4f2',
          100: '#efe9e5',
          200: '#dfd2ca',
          300: '#c6b1a3',
          400: '#a88a77',
          500: '#6F4E37',
          600: '#7e5f4c',
          700: '#694f41',
          800: '#584339',
          900: '#4a3a32',
        },
        lemongreen: {
          50: '#f6f9ed',
          100: '#ecf2d8',
          200: '#dae6b5',
          300: '#c1d486',
          400: '#A4C639',
          500: '#8ba832',
          600: '#6c8426',
          700: '#526420',
          800: '#43501e',
          900: '#3a441d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    }
  },
  plugins: [],
}