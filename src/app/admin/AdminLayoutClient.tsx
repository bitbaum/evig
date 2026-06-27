'use client'

import { useState, useEffect } from 'react'
import { usePathname } from '@/i18n/navigation'
import { AdminSidebar } from './AdminSidebar'
import { HirnFloatingButton } from '@/components/admin/HirnFloatingButton'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
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
    <div className="min-h-screen bg-surface-raised">
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        accessibleSections={accessibleSections}
        pathname={pathname}
      />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <AdminTopBar
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />

        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      <MobileBottomNav
        accessibleSections={accessibleSections}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      <HirnFloatingButton hasAccess={!!hasHirnAccess} />
    </div>
  )
}
