/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe580',
          300: '#ffdb33',
          400: '#FFD700', // Rich Gold
          500: '#FFC107', // Warm Yellow
          600: '#FF8F00', // Amber
          700: '#e07e00',
          800: '#b86200',
          900: '#8a4b08',
        },
        elimux: {
          dark: '#0A0A0A',
          card: '#1A1A1A',
          accent: '#FF8F00',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
    },
  },
  plugins: [],
}
