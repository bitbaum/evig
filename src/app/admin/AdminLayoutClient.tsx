'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from '@/i18n/navigation'
import { Menu, Globe } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { UserMenuDropdown } from './UserMenuDropdown'
import { HirnFloatingButton } from '@/components/admin/HirnFloatingButton'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { CommandBar } from '@/components/admin/CommandBar'
import { MobileBottomNav } from '@/components/admin/MobileBottomNav'
import { Button } from '@/components/ui/button'
import { getHirnSection } from '@/config/sections'
import { adminInteractive } from '@/lib/admin-ui'

interface AdminLayoutClientProps {
  children: React.ReactNode
  user: {
    name: string | null
    email: string
    isStaff: boolean
    staffPermissions: string[]
  } | null
  accessibleSections: string[]
}

export function AdminLayoutClient({
  children,
  user,
  accessibleSections,
}: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('admin.sidebar')
  const tUser = useTranslations('admin.userMenu')

  // Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const hirnSection = getHirnSection()
  const hasHirnAccess = hirnSection && accessibleSections.includes(hirnSection.id)

  return (
    <div className="min-h-screen bg-surface-raised">
      {/* Sidebar */}
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        accessibleSections={accessibleSections}
        pathname={pathname}
      />

      {/* Mobile overlay — /30 in light mode, /50 in dark so it's visible on both */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-40 border-b border bg-surface-base/90 backdrop-blur-xs">
          <div className="flex h-14 items-center justify-between px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className={`shrink-0 rounded-lg p-2 ${adminInteractive.rowHover} lg:hidden`}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg ${adminInteractive.rowHover} lg:flex`}
                title={sidebarCollapsed ? t('expandSidebarTitle') : t('collapseSidebarTitle')}
              >
                <Menu className="h-4 w-4 text-text-tertiary" />
              </Button>

              {/* Breadcrumbs in top bar — saves a full content line */}
              <Breadcrumbs className="mb-0 hidden sm:flex" />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-md border border-action/40 px-3 py-1.5 text-xs font-medium text-action transition-colors hover:border-action hover:bg-action/10 dark:border-action/30 sm:flex"
              >
                <Globe className="w-3.5 h-3.5" />
                {tUser('toWebsite')}
              </Link>

              <CommandBar />
              <NotificationBell />
              <UserMenuDropdown user={user} />
            </div>
          </div>
        </div>

        {/* Page Content — pb-16 on mobile so bottom nav doesn't overlap */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Hirn Floating Button */}
      <HirnFloatingButton hasAccess={!!hasHirnAccess} />
    </div>
  )
}
