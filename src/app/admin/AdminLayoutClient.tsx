'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Globe } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { UserMenuDropdown } from './UserMenuDropdown'
import { HirnFloatingButton } from '@/components/admin/HirnFloatingButton'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { CommandBar } from '@/components/admin/CommandBar'
import { MobileBottomNav } from '@/components/admin/MobileBottomNav'
import { getHirnSection } from '@/config/sections'

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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
        <div className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 flex-shrink-0"
                title={sidebarCollapsed ? 'Seitenleiste aufklappen' : 'Seitenleiste einklappen'}
              >
                <Menu className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </button>

              {/* Breadcrumbs in top bar — saves a full content line */}
              <Breadcrumbs className="mb-0 hidden sm:flex" />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
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
