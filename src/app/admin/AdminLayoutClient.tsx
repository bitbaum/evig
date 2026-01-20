'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Brain,
  Package,
  MapPin,
  Star,
  FileText,
  CheckSquare,
  Home,
  Store,
  ExternalLink,
  type LucideIcon
} from 'lucide-react'
import type { AdminSection } from '@/lib/permissions'

// Map admin sections to nav items
const ADMIN_NAV_CONFIG: Record<AdminSection, {
  name: string
  href: string
  icon: LucideIcon
}> = {
  dashboard: {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  products: {
    name: 'Produkte',
    href: '/admin/products',
    icon: Package,
  },
  workshops: {
    name: 'Workshops',
    href: '/admin/workshops',
    icon: Calendar,
  },
  services: {
    name: 'Dienstleistungen',
    href: '/admin/services',
    icon: Wrench,
  },
  locations: {
    name: 'Standorte',
    href: '/admin/locations',
    icon: MapPin,
  },
  reviews: {
    name: 'Bewertungen',
    href: '/admin/reviews',
    icon: Star,
  },
  content: {
    name: 'Inhalte',
    href: '/admin/content',
    icon: FileText,
  },
  approvals: {
    name: 'Freigaben',
    href: '/admin/approvals',
    icon: CheckSquare,
  },
  users: {
    name: 'Benutzer',
    href: '/admin/users',
    icon: Users,
  },
  team: {
    name: 'Team & HR',
    href: '/admin/team',
    icon: Users,
  },
  finances: {
    name: 'Finanzen',
    href: '/admin/hirn/finanzen',
    icon: BarChart3,
  },
  analytics: {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  settings: {
    name: 'Einstellungen',
    href: '/admin/settings',
    icon: Settings,
  },
  hirn: {
    name: 'Hirn',
    href: '/admin/hirn',
    icon: Brain,
  },
}

// Order of sections in the sidebar
const SIDEBAR_ORDER: AdminSection[] = [
  'dashboard',
  'approvals',
  'products',
  'workshops',
  'services',
  'locations',
  'reviews',
  'content',
  'analytics',
  'hirn',
  'users',
  'team',
  'finances',
  'settings',
]

interface AdminLayoutClientProps {
  children: React.ReactNode
  user: {
    name: string | null
    email: string
    isStaff: boolean
    staffPermissions: string[]
  } | null
  accessibleSections: AdminSection[]
}

export function AdminLayoutClient({
  children,
  user,
  accessibleSections,
}: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Build nav items from accessible sections, in order
  const navItems = SIDEBAR_ORDER
    .filter(section => accessibleSections.includes(section))
    .map(section => ({
      ...ADMIN_NAV_CONFIG[section],
      section,
    }))

  // Check if current path matches a nav item
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Admin
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">R</span>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    active
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-green-600' : ''}`} />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              )
            })}
          </div>

          {/* User-facing site links */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Website
              </p>
            )}
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? 'Startseite' : undefined}
              >
                <Home className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">Startseite</span>}
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? 'Shop' : undefined}
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">Shop</span>}
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? 'Mein Bereich' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">Mein Bereich</span>}
              </Link>
            </div>
          </div>
        </nav>
      </div>

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
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop collapse button for small screens */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex xl:hidden w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                RevampIT Admin
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'Staff'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
