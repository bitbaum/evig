import Link from 'next/link'
import type { QuickAction } from './types'

interface CreateStripProps {
  actions: QuickAction[]
}

export function CreateStrip({ actions }: CreateStripProps) {
  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <span className="self-center text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mr-1">
        Erstellen:
      </span>
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${action.color}`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}
