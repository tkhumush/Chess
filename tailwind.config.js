/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          light: '#f0d9b5',
          dark: '#b58863',
          highlight: '#646f40',
          check: '#f7b801',
          move: '#829769'
        }
      },
      fontFamily: {
        chess: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'piece-move': 'piece-move 0.2s ease-out',
        'zap-ping': 'zap-ping 0.6s ease-out',
      },
      keyframes: {
        'piece-move': {
          '0%': { transform: 'scale(1.1)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'zap-ping': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}