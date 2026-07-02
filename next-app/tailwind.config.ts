import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0f29',
          gold: '#fbbf24',
          lightgold: '#fde047',
          main: '#0B3A7A',
          light: '#EAF3FF',
          border: '#D6E6FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'skewX(-20deg) translateX(-150%)' },
          '100%': { transform: 'skewX(-20deg) translateX(150%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
