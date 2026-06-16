'use client'

/**
 * Mega menu dropdown — x.ai-inspired, design-system strict.
 *
 * Every dropdown uses the same contract:
 *   • Mono uppercase section eyebrow (when grouped)
 *   • Link rows: title + optional one-line description (when configured)
 *   • Optional section overview link at the bottom of each column
 *
 * Descriptions come from navigation config + nav.items.*Desc i18n keys.
 */

import { Link } from '@/i18n/navigation'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { NavigationItem } from '@/config/navigation'
import type { NavigationGroup } from './utils'
import { navItemDescription, navItemLabel, type NavTranslator } from './nav-i18n'

interface MegaMenuContentProps {
  groups: NavigationGroup[]
  subItems: NavigationItem[]
  hasMultipleGroups: boolean
  onClose: () => void
}

type TFn = ReturnType<typeof useTranslations<'nav'>>

function getLabel(item: NavigationItem, t: TFn): string {
  return item.nameKey ? navItemLabel(t as NavTranslator, item.nameKey) : item.name
}

function getDescription(item: NavigationItem, t: TFn): string | undefined {
  if (item.descriptionKey) {
    return navItemDescription(t as NavTranslator, item.descriptionKey)
  }
  return item.description
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
        'mt-2 overflow-hidden rounded-2xl border border-subtle bg-surface-base',
        'animate-in fade-in slide-in-from-top-2 duration-200',
        hasMultipleGroups ? 'p-0' : 'p-3',
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

function MultiColumnLayout({
  groups,
  onClose,
  t,
}: {
  groups: NavigationGroup[]
  onClose: () => void
  t: TFn
}) {
  const gridCols =
    groups.length >= 3 ? 'lg:grid-cols-3' : groups.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'

  return (
    <div className={cn('grid divide-y divide-subtle lg:divide-x lg:divide-y-0', gridCols)}>
      {groups.map((group, idx) => (
        <MegaMenuSection
          key={idx}
          group={group}
          onClose={onClose}
          t={t}
        />
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
  const footerLink = items.find((it) => it.nameKey === 'sectionAllProjects')
  const links = items.filter((it) => !it.isSection && it.nameKey !== 'sectionAllProjects')

  return (
    <div>
      <ul className="space-y-1">
        {links.map((item) => (
          <li key={item.nameKey ?? item.name}>
            <MegaMenuLink item={item} onClose={onClose} t={t} />
          </li>
        ))}
      </ul>
      {footerLink && (
        <SectionOverviewLink item={footerLink} onClose={onClose} t={t} />
      )}
    </div>
  )
}

function MegaMenuSection({
  group,
  onClose,
  t,
}: {
  group: NavigationGroup
  onClose: () => void
  t: TFn
}) {
  return (
    <div className="flex flex-col p-5 sm:p-6">
      {group.section && (
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
          {getLabel(group.section, t)}
        </p>
      )}
      <ul className="space-y-1">
        {group.items.map((item) => (
          <li key={item.nameKey ?? item.name}>
            <MegaMenuLink item={item} onClose={onClose} t={t} />
          </li>
        ))}
      </ul>
      {group.section && (
        <SectionOverviewLink item={group.section} onClose={onClose} t={t} />
      )}
    </div>
  )
}

function MegaMenuLink({
  item,
  onClose,
  t,
}: {
  item: NavigationItem
  onClose: () => void
  t: TFn
}) {
  const label = getLabel(item, t)
  const description = getDescription(item, t)

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'group flex items-start justify-between gap-3 rounded-lg px-3 py-3',
        'transition-colors duration-200',
        'hover:bg-surface-raised',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2',
      )}
      {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary transition-colors group-hover:text-action">
            {label}
          </span>
          <ItemBadge badge={item.badge} />
          {item.external && (
            <ExternalLink className="h-3 w-3 shrink-0 text-text-tertiary" aria-hidden="true" />
          )}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-snug text-text-secondary line-clamp-2">
            {description}
          </span>
        )}
      </span>
      <ArrowRight
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-action"
        aria-hidden="true"
      />
    </Link>
  )
}

function SectionOverviewLink({
  item,
  onClose,
  t,
}: {
  item: NavigationItem
  onClose: () => void
  t: TFn
}) {
  const overviewLabel = navItemLabel(t as NavTranslator, 'viewSection')

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'mt-4 inline-flex items-center gap-1.5 px-3 py-2',
        'font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary',
        'transition-colors hover:text-action',
      )}
      {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {overviewLabel}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  )
}

function ItemBadge({ badge }: { badge?: string }) {
  const t = useTranslations('nav.badge')
  if (!badge) return null
  const label = ((): string => {
    try { return t(badge as never) } catch { return badge }
  })()
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-action-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-action">
      {label}
    </span>
  )
}
