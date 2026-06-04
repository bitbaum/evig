'use client'

/**
 * ProductProfileFields
 *
 * Customer profile selection section. Displays grouped profile buttons
 * that users can toggle to indicate target audiences for the product.
 */

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getProfilesByCategory } from '@/config/erfassung'
import Heading from '@/components/ui/Heading'

interface ProductProfileFieldsProps {
  kundenprofile: string[]
  onProfileToggle: (slug: string) => void
}

export function ProductProfileFields({
  kundenprofile,
  onProfileToggle,
}: ProductProfileFieldsProps) {
  const t = useTranslations('components.erfassung.profileFields')

  return (
    <div className="card-shell p-4 sm:p-6">
      <Heading level={2} className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        {t('title')}
      </Heading>
      <p className="text-sm text-text-secondary mb-3 sm:mb-4 hidden sm:block">
        {t('hint')}
      </p>

      {Object.entries(getProfilesByCategory()).map(([categoryName, profiles]) => (
        <div key={categoryName} className="mb-4 last:mb-0">
          <Heading level={3} className="text-sm font-medium text-text-secondary mb-2">
            {categoryName}
          </Heading>
          <div className="flex flex-wrap gap-2 sm:gap-2">
            {profiles.map(profile => (
              <button
                key={profile.slug}
                type="button"
                onClick={() => onProfileToggle(profile.slug)}
                title={profile.description}
                className={`group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-full border-2 transition-colors touch-manipulation min-h-touch text-sm ${
                  kundenprofile.includes(profile.slug)
                    ? 'border-action bg-action-muted-muted text-action'
                    : 'border-default hover:border-strong active:bg-surface-raised dark:active:bg-surface-overlay'
                }`}
              >
                <span className="text-lg sm:text-base">{profile.icon}</span>
                <span>{profile.name_de}</span>
                {/* Tooltip on hover - hidden on mobile */}
                <span className="hidden sm:block invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-surface-overlay text-white text-xs rounded-lg whitespace-nowrap z-10 max-w-xs">
                  {profile.description}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-neutral-900" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
