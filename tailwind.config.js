/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        notion: {
          bg: '#ffffff',
          'bg-secondary': '#f7f6f3',
          'bg-hover': '#efefef',
          text: '#37352f',
          'text-secondary': '#787774',
          'text-tertiary': '#b4b4b0',
          border: '#e9e9e7',
          'border-strong': '#d3d3d0',
          accent: '#2eaadc',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
