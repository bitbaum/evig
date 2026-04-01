'use client'

/**
 * Mega menu dropdown content
 */

import Link from 'next/link'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavigationItem } from '@/config/navigation'
import type { NavigationGroup } from './utils'

interface MegaMenuContentProps {
  groups: NavigationGroup[]
  subItems: NavigationItem[]
  hasMultipleGroups: boolean
  onClose: () => void
}

export function MegaMenuContent({
  groups,
  subItems,
  hasMultipleGroups,
  onClose,
}: MegaMenuContentProps) {
  return (
    <div
      className={cn(
        "mt-2 bg-white rounded-2xl shadow-2xl shadow-gray-200/50",
        "border border-gray-100",
        "overflow-hidden",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        hasMultipleGroups ? "p-0" : "p-2"
      )}
    >
      {hasMultipleGroups ? (
        <MultiColumnLayout groups={groups} onClose={onClose} />
      ) : (
        <SingleColumnLayout items={subItems} onClose={onClose} />
      )}
    </div>
  )
}

function MultiColumnLayout({
  groups,
  onClose,
}: {
  groups: NavigationGroup[]
  onClose: () => void
}) {
  // Dynamic grid columns based on number of sections
  const gridCols = groups.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className={cn("grid divide-x divide-gray-100", gridCols)}>
      {groups.map((group, idx) => (
        <div key={idx} className="p-6">
          {group.section && (
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">
              {group.section.name}
            </h3>
          )}
          <ul className="space-y-1">
            {group.items.map((subItem) => (
              <li key={subItem.name}>
                <MenuLink item={subItem} onClose={onClose} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function SingleColumnLayout({
  items,
  onClose,
}: {
  items: NavigationItem[]
  onClose: () => void
}) {
  return (
    <div className="py-2">
      {items.map((subItem) => (
        <Link
          key={subItem.name}
          href={subItem.href}
          onClick={onClose}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl",
            "transition-all duration-200",
            "hover:bg-gray-50"
          )}
          {...(subItem.external && { target: "_blank", rel: "noopener noreferrer" })}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                {subItem.name}
              </span>
              <ItemBadge badge={subItem.badge} />
              {subItem.external && <ExternalLink className="w-3 h-3 text-gray-600" />}
            </div>
            {subItem.description && (
              <p className="mt-0.5 text-sm text-gray-600">
                {subItem.description}
              </p>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  )
}

function MenuLink({
  item,
  onClose,
}: {
  item: NavigationItem
  onClose: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "group flex items-start gap-3 p-3 -mx-3 rounded-xl",
        "transition-all duration-200",
        "hover:bg-gray-50"
      )}
      {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
            {item.name}
          </span>
          <ItemBadge badge={item.badge} />
          {item.external && <ExternalLink className="w-3 h-3 text-gray-600" />}
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100 mt-1 flex-shrink-0" />
    </Link>
  )
}

function ItemBadge({ badge }: { badge?: string }) {
  if (!badge) return null

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 rounded-full">
      {badge}
    </span>
  )
}
