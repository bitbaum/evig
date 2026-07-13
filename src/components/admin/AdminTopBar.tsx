'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Menu, Globe } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { CommandBar } from '@/components/admin/CommandBar'
import { UserMenuDropdown } from '@/app/admin/UserMenuDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/button'
import { adminChrome, adminInteractive } from '@/lib/admin-ui'
import { ROUTES } from '@/config/routes'

interface AdminTopBarProps {
  sidebarCollapsed: boolean
  onMobileMenuOpen: () => void
  onToggleSidebar: () => void
  user: {
    name: string | null
    email: string
  } | null
}

/**
 * Admin sticky header — breadcrumbs, global actions, theme (matches public site).
 */
export function AdminTopBar({
  sidebarCollapsed,
  onMobileMenuOpen,
  onToggleSidebar,
  user,
}: AdminTopBarProps) {
  const t = useTranslations('admin.sidebar')
  const tUser = useTranslations('admin.userMenu')

  return (
    <div className={adminChrome.topBar}>
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* flex-1 + min-w-0 so this group yields space to the (shrink-0) actions
            group, and overflow-hidden so a long breadcrumb clips/ellipsizes
            instead of overlapping the "Zur Website" button at ~1024–1280px. */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuOpen}
            className={`shrink-0 rounded-lg p-2 ${adminInteractive.rowHover} lg:hidden`}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg ${adminInteractive.rowHover} lg:flex`}
            title={sidebarCollapsed ? t('expandSidebarTitle') : t('collapseSidebarTitle')}
          >
            <Menu className="h-4 w-4 text-text-tertiary" />
          </Button>

          {/* Shown from lg; the min-w-0 chain lets the last crumb ellipsize
              rather than collide with the actions group when space is tight. */}
          <div className="hidden min-w-0 lg:block">
            <Breadcrumbs className="mb-0 flex min-w-0" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={ROUTES.public.home}
            className={adminChrome.websiteLink}
            title={tUser('toWebsite')}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{tUser('toWebsite')}</span>
          </Link>

          <div className={adminChrome.actionDivider} aria-hidden="true" />

          <ThemeToggle />

          <div className={adminChrome.actionDivider} aria-hidden="true" />

          <CommandBar />
          <NotificationBell />
          <UserMenuDropdown user={user} />
        </div>
      </div>
    </div>
  )
}
