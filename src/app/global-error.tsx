'use client'

// Global error boundary — must include <html> and <body> as it replaces the root layout.
// No lucide-react imports: this file lands in the /_global-error SSR bundle during
// Next.js 16 static generation and lucide triggers the React-null circular dependency
// in certain Turbopack SSR bundles when next-auth v5 beta is present.
// ui-colors import is safe: pure data object, no React/Next.js deps.
import { GLOBAL_ERROR_COLORS } from '@/config/ui-colors'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: GLOBAL_ERROR_COLORS.pageBg }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: GLOBAL_ERROR_COLORS.heading, marginBottom: '0.5rem' }}>
              Etwas ist schiefgelaufen
            </h1>
            <p style={{ color: GLOBAL_ERROR_COLORS.body, marginBottom: '2rem' }}>
              Ein unerwarteter Fehler ist aufgetreten. Versuche die Seite neu zu laden.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{ padding: '0.625rem 1.25rem', background: GLOBAL_ERROR_COLORS.primary, color: GLOBAL_ERROR_COLORS.white, border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
              >
                Erneut versuchen
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- next/link imports useContext which crashes the /_global-error SSR bundle */}
              <a
                href="/"
                style={{ padding: '0.625rem 1.25rem', background: GLOBAL_ERROR_COLORS.white, color: GLOBAL_ERROR_COLORS.secondaryText, border: `1px solid ${GLOBAL_ERROR_COLORS.border}`, borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}
              >
                Zur Startseite
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
