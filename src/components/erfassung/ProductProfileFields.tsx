'use client'

/**
 * ProductProfileFields
 *
 * Customer profile selection section. Displays grouped profile buttons
 * that users can toggle to indicate target audiences for the product.
 */

import { Users } from 'lucide-react'
import { getProfilesByCategory } from '@/config/erfassung'

interface ProductProfileFieldsProps {
  kundenprofile: string[]
  onProfileToggle: (slug: string) => void
}

export function ProductProfileFields({
  kundenprofile,
  onProfileToggle,
}: ProductProfileFieldsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Geeignet für (Kundenprofile)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 hidden sm:block">
        Wähle die Zielgruppen, für die dieses Produkt geeignet ist. Hover für Details.
      </p>

      {Object.entries(getProfilesByCategory()).map(([categoryName, profiles]) => (
        <div key={categoryName} className="mb-4 last:mb-0">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {categoryName}
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-2">
            {profiles.map(profile => (
              <button
                key={profile.slug}
                type="button"
                onClick={() => onProfileToggle(profile.slug)}
                title={profile.description}
                className={`group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-full border-2 transition-colors touch-manipulation min-h-[44px] text-sm ${
                  kundenprofile.includes(profile.slug)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 active:bg-gray-100 dark:active:bg-gray-700'
                }`}
              >
                <span className="text-lg sm:text-base">{profile.icon}</span>
                <span>{profile.name_de}</span>
                {/* Tooltip on hover - hidden on mobile */}
                <span className="hidden sm:block invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 max-w-xs">
                  {profile.description}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
