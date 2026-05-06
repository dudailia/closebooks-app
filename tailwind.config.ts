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
        background: '#080808',
        surface: '#0f0f0f',
        'surface-raised': '#141414',
        'surface-overlay': '#1a1a1a',
        border: '#1f1f1f',
        'border-subtle': '#161616',
        'green-primary': '#00C853',
        'green-glow': 'rgba(0, 200, 83, 0.15)',
        'green-subtle': 'rgba(0, 200, 83, 0.06)',
        'text-primary': '#FAFAFA',
        'text-secondary': '#888888',
        'text-tertiary': '#444444',
        'red-negative': '#FF4444',
        'amber-warning': '#F59E0B',
        // Legacy palette kept for app compatibility
        accent: {
          DEFAULT: '#00C853',
          light: '#e8f0e6',
          dark: '#009640',
        },
        copper: '#b8734a',
        sand: '#f0ece4',
        warm: '#e8e0d4',
        paper: '#faf8f4',
        ink: {
          DEFAULT: '#FAFAFA',
          muted: '#888888',
          faint: '#444444',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'Fira Mono', 'monospace'],
        // Legacy
        serif: ['var(--font-display)', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4)',
        panel: '0 4px 16px rgba(0,0,0,0.6)',
        'green-sm': '0 0 20px rgba(0,200,83,0.15)',
        'green-md': '0 0 40px rgba(0,200,83,0.2)',
        'green-lg': '0 0 80px rgba(0,200,83,0.25)',
        focus: '0 0 0 2px #00C853',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.18s ease both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-green': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,200,83,0.1)' },
          '50%': { boxShadow: '0 0 60px rgba(0,200,83,0.3)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
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
