import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/config/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ─── Semantic token layer — FINAL DESIGN SYSTEM ──────────────────────
        // All backed by CSS custom properties in globals.css (light + dark
        // values defined once). Component authors should use ONLY these
        // tokens — never palette scales (primary-100, neutral-700, etc.).
        // Palette scales remain below for legacy code during migration.
        //
        // Naming follows role, not appearance: a button is `bg-action`, not
        // `bg-green-600`. A card is `bg-surface-base`, not `bg-white`.
        // ───────────────────────────────────────────────────────────────────
        surface: {
          page:    'var(--surface-page)',    // body background
          base:    'var(--surface-base)',    // cards, panels, modals
          raised:  'var(--surface-raised)',  // section backgrounds, secondary fills
          overlay: 'var(--surface-overlay)', // dropdowns, tooltips, popovers
        },
        text: {
          primary:   'var(--text-primary)',   // headings, primary body text
          secondary: 'var(--text-secondary)', // body text, descriptions
          tertiary:  'var(--text-tertiary)',  // meta, labels, secondary info
          muted:     'var(--text-muted)',     // placeholders, disabled state
          inverted:  'var(--text-inverted)',  // text on dark/action surfaces
        },
        // The brand. Used ONLY on action surfaces (primary buttons, links,
        // focus rings, key icons) — everything else stays achromatic.
        action: {
          DEFAULT: 'var(--accent-action)',
          hover:   'var(--accent-action-hover)',
          muted:   'var(--accent-action-muted)',  // subtle fills (badges, hover bg)
          text:    'var(--accent-action-text)',   // text color of action elements
        },
        // ─── Legacy aliases (kept for migration; do NOT use in new code) ───
        canvas: 'var(--surface-page)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-muted)',
        // 'surface' DEFAULT alias points to surface-base for backward compat
        // with `bg-surface` callers — surface.base is the preferred form.

        // Primary brand color (Green - Sustainability)
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Secondary color (Bitcoin Orange)
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F7931A',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Neutral grays for backgrounds and text
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Semantic colors for status and feedback
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Third-party brand colors — used only in share/social components
        brand: {
          mastodon: '#6364FF',
          'mastodon-hover': '#563ACC',
          linkedin: '#0A66C2',
          'linkedin-hover': '#004182',
          facebook: '#1877F2',
          'facebook-hover': '#0C63D4',
        },
      },
      // Border/divide colors — semantic tokens for borders. Lives in its own
      // namespace (not `colors`) so it doesn't conflict with the `border`
      // (width=1px) utility and so `border` alone still works to mean
      // "1px border using --border-default".
      borderColor: {
        subtle:      'var(--border-subtle)',
        DEFAULT:     'var(--border-default)',
        strong:      'var(--border-strong)',
        interactive: 'var(--border-strong)',
      },
      divideColor: {
        subtle:      'var(--border-subtle)',
        DEFAULT:     'var(--border-default)',
        strong:      'var(--border-strong)',
      },
      // Ring color follows the action accent so focus states are consistent
      ringColor: {
        action: 'var(--accent-action)',
      },
      // Mobile-first spacing and sizing
      spacing: {
        'touch': '44px', // Minimum touch target size
      },
      // Improved mobile typography
      fontSize: {
        'xs-mobile': ['0.75rem', { lineHeight: '1.5' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.5' }],
        'base-mobile': ['1rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
}

export default config 