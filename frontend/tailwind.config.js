/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ─── Design-system colour tokens ────────────────────────────────
      // Every value maps to the corresponding CSS variable so that
      // changing one CSS var in index.css recolours the whole app.
      colors: {
        // Primary indigo brand ramp
        primary: {
          900: 'var(--color-primary-900)',   // #090870
          700: 'var(--color-primary-700)',   // #0F0E9A  ← brand
          600: 'var(--color-primary-600)',   // #2B2AB0
          500: 'var(--color-primary-500)',   // #4F4EC6
          300: 'var(--color-primary-300)',   // #A3A2E2
          100: 'var(--color-primary-100)',   // #E2E2F6
          50:  'var(--color-primary-50)',    // #F3F3FB
          DEFAULT: 'var(--color-primary-700)',
        },
        // Surfaces & page
        'bg-page':   'var(--color-bg-page)',   // #F6F7FB
        surface:     'var(--color-surface)',    // #FFFFFF
        // Borders
        border: {
          DEFAULT: 'var(--color-border)',         // #E0E3EC
          strong: 'var(--color-border-strong)',   // #C8CCDA
        },
        // Text shades
        'text-primary':   'var(--color-text-primary)',    // #1A1C2E
        'text-secondary': 'var(--color-text-secondary)',  // #5A6078
        'text-disabled':  'var(--color-text-disabled)',   // #9AA0B4
        // Semantic
        positive: {
          DEFAULT: 'var(--color-positive)',   // #1B7F55
          bg:      'var(--color-positive-bg)', // #E6F5EE
        },
        negative: {
          DEFAULT: 'var(--color-negative)',   // #C0392B
          bg:      'var(--color-negative-bg)', // #FCEBE9
        },
        warning: {
          DEFAULT: 'var(--color-warning)',   // #A66A00
          bg:      'var(--color-warning-bg)', // #FFF3D6
        },

        // ─── Legacy aliases kept so existing classnames still resolve ──
        // (components still use these; remove once fully migrated)
        'sop-positive':     'var(--color-positive)',
        'sop-positiveBg':   'var(--color-positive-bg)',
        'sop-negative':     'var(--color-negative)',
        'sop-negativeBg':   'var(--color-negative-bg)',
        'sop-tableHeader':  'var(--color-primary-700)',
        'sop-committedBg':  'var(--color-positive-bg)',
        'sop-committedText':'var(--color-positive)',
        'sop-savedBg':      'var(--color-warning-bg)',
        'sop-savedText':    'var(--color-warning)',
        'sop-cg3':          'var(--color-warning-bg)',
        // Page / canvas aliases
        'page':             'var(--color-bg-page)',
        'canvas-subtle':    'var(--color-primary-50)',
        'canvas-muted':     'var(--color-primary-100)',
        // Ink (text) aliases
        'ink':              'var(--color-text-primary)',
        'ink-muted':        'var(--color-text-secondary)',
        'border-dark':      'var(--color-border-strong)',
        'border-muted':     'var(--color-border)',
        'border-sop-tableHeaderBorder': 'var(--color-primary-900)',
      },

      // ─── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['14px', { lineHeight: '1.5' }],
        base:  ['14px', { lineHeight: '1.6' }],
        md:    ['16px', { lineHeight: '1.5' }],
        lg:    ['20px', { lineHeight: '1.4' }],
        xl:    ['24px', { lineHeight: '1.3' }],
      },

      // ─── Radius ──────────────────────────────────────────────────────
      borderRadius: {
        none: '0px',
        sm:   '4px',
        card: '8px',    // cards, drawers, modals
        full: '9999px', // pills, circular buttons
      },

      // ─── Shadows ─────────────────────────────────────────────────────
      boxShadow: {
        card:   '0 1px 2px rgba(15, 14, 154, 0.06)',
        dock:   '0 -4px 12px 0 rgba(15, 14, 154, 0.08)',
        drawer: '0 0 24px rgba(15, 14, 154, 0.12)',
      },
    },
  },
  plugins: [],
};
