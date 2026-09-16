/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          muted: '#F5F2EB',
          border: '#E8E3D9',
          'border-strong': '#D4CDC0',
          text: '#2C2B29',
          secondary: '#5C5A55',
          subtle: '#8C887E'
        },
        node: {
          axiom: '#26547C',
          definition: '#2A7B62',
          theorem: '#A8423F',
          corollary: '#C67D28'
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Fira Code"', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
