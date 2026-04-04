import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2d5a27',
          light:   '#e8f0e6',
          dark:    '#1e3d1a',
        },
        copper: '#b8734a',
        sand:   '#f0ece4',
        warm:   '#e8e0d4',
        paper:  '#faf8f4',
        ink: {
          DEFAULT: '#1a1714',
          muted:   '#6b6560',
          faint:   '#a09a94',
        },
        border: '#e0dbd4',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'Fira Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(26,23,20,0.06)',
        panel: '0 4px 16px rgba(26,23,20,0.08)',
        focus: '0 0 0 2px #2d5a27',
      },
      animation: {
        'spin':        'spin 0.75s linear infinite',
        'pulse-soft':  'pulse-soft 1.8s ease-in-out infinite',
        'fade-up':     'fadeUp 0.18s ease both',
      },
      keyframes: {
        spin: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
