/** @type {import('tailwindcss').Config} */
export default {
  content: ['./indexcodeeditor.html', './admin-content.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff4ef',
          100: '#ffe8dc',
          200: '#ffc8ad',
          300: '#ffa37f',
          400: '#ff7f53',
          500: '#ff6b3d',
          600: '#f45221',
          700: '#cc3f12',
          800: '#a63812',
          900: '#872f14'
        }
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};
