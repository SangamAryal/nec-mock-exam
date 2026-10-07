/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        muted: v('muted'),
        line: v('line'),
        ink: v('ink'),
        sub: v('sub'),
        brand: v('brand'),
        'brand-ink': v('brand-ink'),
        accent: v('accent'),
        ok: v('ok'),
        'ok-soft': v('ok-soft'),
        bad: v('bad'),
        'bad-soft': v('bad-soft'),
        warn: v('warn'),
        'warn-soft': v('warn-soft'),
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px -6px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
