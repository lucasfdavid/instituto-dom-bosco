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
        navy: {
          DEFAULT: '#0D1B3E',
          mid: '#162548',
          light: '#1E3260',
        },
        teal: {
          DEFAULT: '#3FBFAD',
          light: '#E8F8F6',
          mid: '#C2EDE8',
        },
        d1: { DEFAULT: '#2563EB', bg: '#EFF6FF' },
        d7: { DEFAULT: '#7C3AED', bg: '#F5F3FF' },
        d30: { DEFAULT: '#DC2626', bg: '#FEF2F2' },
        done: { DEFAULT: '#059669', bg: '#ECFDF5' },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        condensed: ['var(--font-barlow-condensed)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
