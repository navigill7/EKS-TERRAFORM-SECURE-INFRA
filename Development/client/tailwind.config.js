/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#E6FBFF',
            100: '#CCF7FE',
            200: '#99EEFD',
            300: '#66E6FC',
            400: '#33DDFB',
            500: '#00D5FA',
            600: '#00A0BC',
            700: '#006B7D',
            800: '#00353F',
            900: '#001519',
          },
          grey: {
            0: '#FFFFFF',
            10: '#F6F6F6',
            50: '#F0F0F0',
            100: '#E0E0E0',
            200: '#C2C2C2',
            300: '#A3A3A3',
            400: '#858585',
            500: '#666666',
            600: '#4D4D4D',
            700: '#333333',
            800: '#1A1A1A',
            900: '#0A0A0A',
            1000: '#000000',
          },
        },
        fontFamily: {
          sans: ['Rubik', 'sans-serif'],
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-in-out',
          'slide-in': 'slideIn 0.3s ease-out',
          'scale-in': 'scaleIn 0.2s ease-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideIn: {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          scaleIn: {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' },
          },
        },
      },
    },
    plugins: [],
  }