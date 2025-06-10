/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pink': {
          100: '#FFE0EC',
          200: '#FFB8D9',
          300: '#FF91C5',
          400: '#FF6AB1',
          500: '#FF439D',
          600: '#DB2A7D',
          700: '#B7195F',
          800: '#930E44',
          900: '#70072D',
          950: '#4D0018',
        },
        'lavender': {
          100: '#EEE0FF',
          200: '#D8BDFF',
          300: '#C49AFF',
          400: '#B077FF',
          500: '#9C54FF',
          600: '#7C35DB',
          700: '#5F1FB7',
          800: '#441193',
          900: '#2E0870',
          950: '#1B044D',
        },
        'mint': {
          100: '#D2F7E9',
          200: '#A5EFD2',
          300: '#79E7BC',
          400: '#4DDFA5',
          500: '#20D78F',
          600: '#15B876',
          700: '#0D995E',
          800: '#067A46',
          900: '#025C34',
          950: '#003E22',
        },
        'babyblue': {
          100: '#D3F0FF',
          200: '#A7E0FF',
          300: '#7BD0FF',
          400: '#4FC1FF',
          500: '#23B1FF',
          600: '#1492DB',
          700: '#0973B7',
          800: '#025593',
          900: '#003C70',
          950: '#00264D',
        }
      },
      fontFamily: {
        'sans': ['Nunito', 'sans-serif'],
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        }
      },
      animation: {
        heartbeat: 'heartbeat 1.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        sparkle: 'sparkle 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};