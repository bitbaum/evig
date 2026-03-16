import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { type OSSAlternative, getProprietaryAppById, getCategoryById } from '@/config/open-source-registry'
import { MaturityBadge } from './MaturityBadge'
import { PlatformIcons } from './PlatformIcons'

interface AlternativeCardProps {
  alternative: OSSAlternative
}

function AlternativeCardComponent({ alternative }: AlternativeCardProps) {
  const category = getCategoryById(alternative.categoryId)

  return (
    <Link
      href={`/services/open-source-solutions/${alternative.id}`}
      className={cn(
        'group block bg-white rounded-xl border-2 border-gray-200',
        'hover:border-blue-300 hover:shadow-lg transition-all duration-200',
        'p-5 sm:p-6'
      )}
    >
      {/* Header: Name + Category */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
            {alternative.name}
          </h3>
          {category && (
            <span className="text-xs text-gray-500">
              {category.icon} {category.label}
            </span>
          )}
        </div>
        <MaturityBadge maturity={alternative.maturity} className="ml-2 shrink-0" />
      </div>

      {/* Tagline */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {alternative.tagline}
      </p>

      {/* Replaces badges */}
      {alternative.replaces.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {alternative.replaces.map(r => {
            const app = getProprietaryAppById(r.appId)
            if (!app) return null
            return (
              <span
                key={r.appId}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium"
              >
                Ersetzt {app.name}
              </span>
            )
          })}
        </div>
      )}

      {/* Footer: Platforms + License */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <PlatformIcons platforms={alternative.platforms} />
        <span className="text-xs text-gray-500 font-medium">
          {alternative.license}
        </span>
      </div>
    </Link>
  )
}

export const AlternativeCard = React.memo(AlternativeCardComponent)
