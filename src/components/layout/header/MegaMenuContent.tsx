'use client'

/**
 * Mega menu dropdown content
 */

import { Link } from '@/i18n/navigation'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
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
  const t = useTranslations('nav')

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
        <MultiColumnLayout groups={groups} onClose={onClose} t={t} />
      ) : (
        <SingleColumnLayout items={subItems} onClose={onClose} t={t} />
      )}
    </div>
  )
}

type TFn = ReturnType<typeof useTranslations<'nav'>>

function getLabel(item: NavigationItem, t: TFn): string {
  return item.nameKey ? t(item.nameKey as never) : item.name
}

function MultiColumnLayout({
  groups,
  onClose,
  t,
}: {
  groups: NavigationGroup[]
  onClose: () => void
  t: TFn
}) {
  // Dynamic grid columns based on number of sections
  const gridCols = groups.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className={cn("grid divide-x divide-gray-100", gridCols)}>
      {groups.map((group, idx) => (
        <div key={idx} className="p-6">
          {group.section && (
            <Heading level={3} className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">
              {getLabel(group.section, t)}
            </Heading>
          )}
          <ul className="space-y-1">
            {group.items.map((subItem) => (
              <li key={subItem.name}>
                <MenuLink item={subItem} onClose={onClose} t={t} />
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
  t,
}: {
  items: NavigationItem[]
  onClose: () => void
  t: TFn
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
                {getLabel(subItem, t)}
              </span>
              <ItemBadge badge={subItem.badge} />
              {subItem.external && <ExternalLink className="w-3 h-3 text-gray-600" />}
            </div>
            {(subItem.descriptionKey || subItem.description) && (
              <p className="mt-0.5 text-sm text-gray-600">
                {subItem.descriptionKey ? t(`items.${subItem.descriptionKey}` as never) : subItem.description}
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
  t,
}: {
  item: NavigationItem
  onClose: () => void
  t: TFn
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
            {getLabel(item, t)}
          </span>
          <ItemBadge badge={item.badge} />
          {item.external && <ExternalLink className="w-3 h-3 text-gray-600" />}
        </div>
        {(item.descriptionKey || item.description) && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {item.descriptionKey ? t(`items.${item.descriptionKey}` as never) : item.description}
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
