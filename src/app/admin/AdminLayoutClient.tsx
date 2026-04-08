'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Globe } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { UserMenuDropdown } from './UserMenuDropdown'
import { HirnFloatingButton } from '@/components/admin/HirnFloatingButton'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import Heading from '@/components/ui/Heading'
import { NotificationBell } from '@/components/admin/NotificationBell'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        accessibleSections={accessibleSections}
        pathname={pathname}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
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
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex xl:hidden w-10 h-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              <Heading level={1} className="text-xl font-semibold text-gray-900 dark:text-white">
                RevampIT Admin
              </Heading>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Globe className="w-4 h-4" />
                Website
              </Link>

              <NotificationBell />
              <UserMenuDropdown user={user} />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>

      {/* Hirn Floating Button */}
      <HirnFloatingButton hasAccess={!!hasHirnAccess} />
    </div>
  )
}
