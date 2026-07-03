import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sn: {
          black:   '#050508',
          dark:    '#0a0a12',
          surface: '#0f0f1a',
          card:    '#141422',
          border:  '#1e1e30',
          cyan:    '#00e5ff',
          purple:  '#7c3aed',
          violet:  '#a855f7',
          pink:    '#f472b6',
          gold:    '#fbbf24',
          white:   '#f0f0ff',
          muted:   '#6b7280',
          green:   '#34d399',
          red:     '#f87171',
          orange:  '#fb923c',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
