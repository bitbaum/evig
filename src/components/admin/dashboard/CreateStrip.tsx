import { Link } from '@/i18n/navigation'
import type { QuickAction } from './types'

interface CreateStripProps {
  actions: QuickAction[]
}

/**
 * Schnell-Erstellen row.
 *
 * No outer card chrome — just an eyebrow + a horizontal pill row.
 * Lives directly on the page background so it doesn't stack visually
 * with the other dashboard blocks. Each pill keeps its semantic
 * action color from `buildQuickActions`; the row wraps to multiple
 * lines on narrow viewports.
 */
export function CreateStrip({ actions }: CreateStripProps) {
  if (actions.length === 0) return null

  return (
    <section aria-labelledby="dashboard-create-title">
      <h2
        id="dashboard-create-title"
        className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
      >
        Schnell erstellen
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`inline-flex min-h-touch items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${action.color}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
