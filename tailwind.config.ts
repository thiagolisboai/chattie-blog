import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAFBF3',
        'chattie-black': '#000000',
        lavender: '#E4C1F9',
        orange: '#F4B13F',
        rust: '#E57B33',
        cyan: '#66BAC6',
        teal: '#2F6451',
        sage: '#B7C3B0',
      },
      fontFamily: {
        display: ['Sherika', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
