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
          navy: '#1D2354',
          navyLight: '#2a3366',
          dark: '#0a0f29',
          main: '#0B3A7A',
          cyan: '#4FC6F2',
          gold: '#fbbf24',
          lightgold: '#fde047',
          light: '#EAF3FF',
          line: '#D6E6FF',
          border: '#D6E6FF',
          background: '#F8FAFC',
          white: '#FFFFFF',
          text: '#0F172A',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      zIndex: {
        'fixed-cta': '40',
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
