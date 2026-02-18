import Link from 'next/link'
import { Zap, ArrowRight, Check } from 'lucide-react'
import type { ActionItem } from './types'

interface ActionItemsSectionProps {
  actionItems: ActionItem[]
}

export function ActionItemsSection({ actionItems }: ActionItemsSectionProps) {
  const hasNoActionItems = actionItems.length === 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Was gibt es zu tun?
        </h2>
      </div>

      <div className="p-4">
        {hasNoActionItems ? (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <span className="font-medium">Alles erledigt! Keine offenen Aufgaben.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.type === 'urgent'
                        ? 'bg-red-500'
                        : item.type === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {item.actionLabel}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
