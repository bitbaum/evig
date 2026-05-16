import { Link } from '@/i18n/navigation'
import { Plus } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { QuickAction } from './types'

interface CreateStripProps {
  actions: QuickAction[]
}

export function CreateStrip({ actions }: CreateStripProps) {
  if (actions.length === 0) return null

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-white/[0.06]">
      <div className="p-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary-500 flex-shrink-0" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-neutral-900 dark:text-white">
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
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${action.color}`}
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
