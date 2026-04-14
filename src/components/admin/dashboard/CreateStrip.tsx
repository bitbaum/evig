import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import type { QuickAction } from './types'

interface CreateStripProps {
  actions: QuickAction[]
}

export function CreateStrip({ actions }: CreateStripProps) {
  if (actions.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <Heading level={2} className="font-semibold text-gray-900 dark:text-white">
          Erstellen
        </Heading>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${action.color}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
