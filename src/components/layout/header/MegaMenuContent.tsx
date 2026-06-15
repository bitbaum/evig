'use client'

/**
 * Mega menu dropdown content
 */

import { Link } from '@/i18n/navigation'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import { DESIGN_TOKENS } from '@/lib/design/tokens'
import type { NavigationItem } from '@/config/navigation'
import type { NavigationGroup } from './utils'
import { navItemDescription, navItemLabel, type NavTranslator } from './nav-i18n'

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
        'mt-2 bg-surface-base rounded-2xl border border-subtle',
        'overflow-hidden',
        'animate-in fade-in slide-in-from-top-2 duration-200',
        hasMultipleGroups ? 'p-0' : 'p-2',
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
  return item.nameKey ? navItemLabel(t as NavTranslator, item.nameKey) : item.name
}

function getDescription(item: NavigationItem, t: TFn): string | undefined {
  if (item.descriptionKey) return navItemDescription(t as NavTranslator, item.descriptionKey)
  return item.description
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
    <div className={cn("grid divide-x divide-neutral-100 dark:divide-white/6", gridCols)}>
      {groups.map((group, idx) => {
        const featured = group.items.find((it) => it.featured)
        const rest = group.items.filter((it) => !it.featured)
        return (
          <div key={idx} className="p-6 flex flex-col">
            {group.section && (
              <Heading level={3} className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                {getLabel(group.section, t)}
              </Heading>
            )}
            {featured && (
              <FeaturedCard item={featured} onClose={onClose} t={t} />
            )}
            {rest.length > 0 && (
              <ul className={cn('space-y-1', featured && 'mt-3')}>
                {rest.map((subItem) => (
                  <li key={subItem.name}>
                    <MenuLink item={subItem} onClose={onClose} t={t} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FeaturedCard({
  item,
  onClose,
  t,
}: {
  item: NavigationItem
  onClose: () => void
  t: TFn
}) {
  const Icon = item.featuredIcon
  const themeKey = item.featuredTheme ?? 'marketplace'
  const badge = DESIGN_TOKENS.iconBadges[themeKey]
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'group block rounded-xl p-4',
        'border border-primary-300 dark:border-primary-500/30',
        'ring-1 ring-primary-200 dark:ring-primary-500/20',
        'bg-surface-base hover:bg-surface-raised dark:hover:bg-surface-base/4',
        'transition-colors duration-200'
      )}
      {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', badge.bg)}>
            <Icon className={cn('h-5 w-5', badge.text)} aria-hidden="true" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary group-hover:text-action transition-colors">
              {getLabel(item, t)}
            </span>
            <ItemBadge badge={item.badge} />
          </div>
          {(item.descriptionKey || item.description) && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {getDescription(item, t)}
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-action group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
    </Link>
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
  // Featured items (e.g. the active Monitor-Upcycling project) render as a
  // hero card on top so the menu has a clear focal point. Rest of the list
  // follows below.
  const featured = items.find((it) => it.featured)
  const footerLink = items.find((it) => it.nameKey === 'sectionAllProjects')
  const rest = items.filter((it) => !it.featured && it.nameKey !== 'sectionAllProjects')
  return (
    <div className={cn(featured ? 'p-4' : 'py-2')}>
      {featured && (
        <div className="mb-2">
          <FeaturedCard item={featured} onClose={onClose} t={t} />
        </div>
      )}
      {rest.map((subItem) => (
        <Link
          key={subItem.name}
          href={subItem.href}
          onClick={onClose}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl",
            "transition-all duration-200",
            "hover:bg-surface-raised dark:hover:bg-surface-base/4"
          )}
          {...(subItem.external && { target: "_blank", rel: "noopener noreferrer" })}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary group-hover:text-action dark:group-hover:text-action transition-colors">
                {getLabel(subItem, t)}
              </span>
              <ItemBadge badge={subItem.badge} />
              {subItem.external && <ExternalLink className="w-3 h-3 text-text-secondary" />}
            </div>
            {(subItem.descriptionKey || subItem.description) && (
              <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">
                {getDescription(subItem, t)}
              </p>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted dark:text-text-secondary group-hover:text-action dark:group-hover:text-action group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
        </Link>
      ))}
      {footerLink && (
        <div className="mt-2 border-t border-subtle pt-2 px-2">
          <Link
            href={footerLink.href}
            onClick={onClose}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-action hover:bg-surface-raised transition-colors"
          >
            {getLabel(footerLink, t)}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
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
        "hover:bg-surface-raised dark:hover:bg-surface-base/4"
      )}
      {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary group-hover:text-action dark:group-hover:text-action transition-colors">
            {getLabel(item, t)}
          </span>
          <ItemBadge badge={item.badge} />
          {item.external && <ExternalLink className="w-3 h-3 text-text-secondary" />}
        </div>
        {(item.descriptionKey || item.description) && (
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">
            {getDescription(item, t)}
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-text-muted dark:text-text-secondary group-hover:text-action dark:group-hover:text-action group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100 mt-1 shrink-0" />
    </Link>
  )
}

function ItemBadge({ badge }: { badge?: string }) {
  const t = useTranslations('nav.badge')
  if (!badge) return null
  // `badge` in navigation config is an i18n key (e.g. "new"), not a literal.
  // Render the translated text; fall back to the raw key on a miss so we
  // never show empty space.
  const label = ((): string => {
    try { return t(badge as never) } catch { return badge }
  })()
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-action-muted text-action rounded-full">
      {label}
    </span>
  )
}
