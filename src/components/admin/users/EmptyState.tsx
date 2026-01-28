'use client'

/**
 * Empty state when no users exist
 */

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Noch keine Benutzer
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Es wurden noch keine Benutzer registriert.
      </p>
    </div>
  )
}
