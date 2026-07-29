'use client'

// Owns a single sub-item row inside a mobile nav group (internal button or external link, with badge + description).

import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NavigationItem } from '@/config/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { navItemDescription, navItemLabel, type NavTranslator } from '@/components/layout/header/nav-i18n'

export function MobileSubLink({
  subItem,
  t,
  badgeLabel,
  onNavigate,
  onClose,
}: {
  subItem: NavigationItem
  t: ReturnType<typeof useTranslations<'nav'>>
  badgeLabel: (key: string | undefined) => string | null
  onNavigate: (href: string) => void
  onClose: () => void
}) {
  const subLabel = subItem.nameKey ? navItemLabel(t as NavTranslator, subItem.nameKey) : subItem.name
  const subDescription = subItem.descriptionKey
    ? navItemDescription(t as NavTranslator, subItem.descriptionKey)
    : subItem.description

  if (subItem.external) {
    return (
      <li>
        <a
          href={subItem.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group block rounded-lg px-2 py-2.5',
            'hover:bg-surface-raised transition-colors duration-200',
          )}
          onClick={onClose}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            {subLabel}
            {subItem.badge && (
              <span className="rounded-full bg-action-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-action">
                {badgeLabel(subItem.badge)}
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-text-tertiary" />
          </span>
          {subDescription && (
            <span className="mt-0.5 block text-xs leading-snug text-text-secondary line-clamp-2">
              {subDescription}
            </span>
          )}
        </a>
      </li>
    )
  }

  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'group flex h-auto w-full flex-col items-start justify-start rounded-lg px-2 py-2.5',
          'hover:bg-surface-raised transition-colors duration-200',
        )}
        onClick={() => onNavigate(subItem.href)}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          {subLabel}
          {subItem.badge && (
            <span className="rounded-full bg-action-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-action">
              {badgeLabel(subItem.badge)}
            </span>
          )}
        </span>
        {subDescription && (
          <span className="mt-0.5 block text-left text-xs leading-snug text-text-secondary line-clamp-2">
            {subDescription}
          </span>
        )}
      </Button>
    </li>
  )
}
