import Link from 'next/link'
import type { QuickAction } from './types'
import Heading from '@/components/ui/Heading'

interface QuickActionsSectionProps {
  quickActions: QuickAction[]
}

export function QuickActionsSection({ quickActions }: QuickActionsSectionProps) {
  if (quickActions.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <Heading level={2} className="font-semibold text-gray-900 dark:text-white">
          Schnellaktionen
        </Heading>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${action.color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium text-center">
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
