/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark mode toggles via class="dark"
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDFBF7',
          100: '#FAF2E4',
          200: '#F4E2C2',
          300: '#EBCC96',
          400: '#DFB262',
          500: '#C99436', // Signature Brand Gold
          600: '#AD7922',
          700: '#8C5D17',
          800: '#6B4412',
          900: '#4B2D0B',
          950: '#2B1705',
        },
        amber: {
          50: '#FDFBF7',
          100: '#FAF2E4',
          200: '#F4E2C2',
          300: '#EBCC96',
          400: '#DFB262',
          500: '#C99436', // Rich Royal Gold matching logo arch & cloche
          600: '#AD7922',
          700: '#8C5D17',
          800: '#6B4412',
          900: '#4B2D0B',
          950: '#2B1705',
        },
        gold: {
          50: '#FCF9F2',
          100: '#F7EED9',
          200: '#EEDCB2',
          300: '#E3C584',
          400: '#D7AC55',
          500: '#C99436',
          600: '#B27D27',
          700: '#8F5F1B',
          800: '#704815',
          900: '#543410',
        },
        espresso: {
          50: '#F9F6F4',
          100: '#F1E9E4',
          200: '#E1D0C6',
          300: '#CCB1A1',
          400: '#B08C76',
          500: '#8C644E',
          600: '#6D4A37',
          700: '#523323',
          800: '#381F13',
          900: '#23120B', // Deep Logo Brown
          950: '#140905',
        },
        slate: {
          305: '#cbd5e1',
          350: '#cbd5e1',
          450: '#94a3b8',
          455: '#94a3b8',
          550: '#64748b',
          650: '#475569',
          750: '#334155',
          850: '#1e293b',
        },
      },
    },
  },
  plugins: [],
}
