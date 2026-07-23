/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary-600) / <alpha-value>)',
          foreground: 'rgb(var(--elimux-dark) / <alpha-value>)',
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)', // Rich Gold (dark) / DarkGoldenrod (light)
          500: 'rgb(var(--primary-500) / <alpha-value>)', // Warm Yellow (dark) / Goldenrod (light)
          600: 'rgb(var(--primary-600) / <alpha-value>)', // Amber (dark) / deep gold (light)
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
        },
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--primary-500) / <alpha-value>)',
        background: 'rgb(var(--elimux-dark) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--elimux-card) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--elimux-card) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--elimux-card) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--elimux-accent) / <alpha-value>)',
          foreground: 'rgb(var(--elimux-dark) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        elimux: {
          dark: 'rgb(var(--elimux-dark) / <alpha-value>)',
          card: 'rgb(var(--elimux-card) / <alpha-value>)',
          accent: 'rgb(var(--elimux-accent) / <alpha-value>)',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
    },
  },
  plugins: [],
}
