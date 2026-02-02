
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#667eea',
        'primary-dark': '#764ba2',
        'secondary': '#48bb78',
        'danger': '#f56565',
        'warning': '#ed8936',
        'info': '#4299e1',
        'dark': '#1a202c',
        'gray-light': '#f8f9fa',
        'gray-border': '#e9ecef',
      },
      spacing: {
        '7.5': '30px',
        '15': '60px',
        '18': '72px',
      },
      fontSize: {
        'xxs': '0.65rem',
      }
    },
  },
  plugins: [],
}
