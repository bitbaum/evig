'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Store,
  Globe,
  Shield,
  User,
  Brain,
  LogOut,
  Moon,
  Sun,
  ExternalLink,
} from 'lucide-react'
import {
  getSidebarGroupsWithSections,
  getHirnSection,
  isSensitiveSection,
  type SidebarGroupId,
} from '@/config/sections'
import { getSensitivityReason } from '@/config/sensitive-areas'
import { HirnFloatingButton } from '@/components/admin/HirnFloatingButton'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { NotificationBell } from '@/components/admin/NotificationBell'

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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<SidebarGroupId>>(() => {
    // Default: expand first 3 groups
    return new Set(['uebersicht', 'angebot', 'inhalte'])
  })
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Get grouped sections from SSOT
  const groupedSections = getSidebarGroupsWithSections()
  const hirnSection = getHirnSection()
  const hasHirnAccess = hirnSection && accessibleSections.includes(hirnSection.id)

  // Toggle group expansion
  const toggleGroup = (groupId: SidebarGroupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Check if current path matches a nav item
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Check if group contains active item
  const groupHasActiveItem = (groupId: SidebarGroupId) => {
    const group = groupedSections.find(g => g.group.id === groupId)
    if (!group) return false
    return group.sections.some(s => isActive(s.path) && accessibleSections.includes(s.id))
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
              <Image
                src="/images/logo/revampit-favicon.png"
                alt="RevampIT"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Admin
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/admin" className="mx-auto">
              <Image
                src="/images/logo/revampit-favicon.png"
                alt="RevampIT"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </Link>
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
        <nav className="mt-2 px-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Grouped Navigation */}
          {groupedSections.map(({ group, sections }) => {
            // Filter to accessible sections
            const accessibleGroupSections = sections.filter(s => accessibleSections.includes(s.id))
            if (accessibleGroupSections.length === 0) return null

            const isExpanded = expandedGroups.has(group.id)
            const hasActive = groupHasActiveItem(group.id)

            return (
              <div key={group.id} className="mb-2">
                {/* Group Header */}
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                      hasActive
                        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                    />
                  </button>
                )}

                {/* Group Items */}
                {(isExpanded || sidebarCollapsed) && (
                  <div className={`space-y-1 ${sidebarCollapsed ? '' : 'mt-1'}`}>
                    {accessibleGroupSections.map(section => {
                      const active = isActive(section.path)
                      const sensitive = isSensitiveSection(section.id)
                      const sensitivityReason = sensitive ? getSensitivityReason(section.id) : undefined
                      const Icon = section.ui.icon

                      return (
                        <Link
                          key={section.path}
                          href={section.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            sidebarCollapsed ? 'justify-center' : ''
                          } ${
                            active
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={sidebarCollapsed ? `${section.ui.label}${sensitive ? ' (Geschützt)' : ''}` : sensitivityReason}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-green-600' : ''}`} />
                          {!sidebarCollapsed && (
                            <span className="flex-1 text-sm font-medium flex items-center gap-2">
                              {section.ui.label}
                              {sensitive && (
                                <span title={sensitivityReason}>
                                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Hirn AI - Special Item */}
          {hasHirnAccess && hirnSection && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={hirnSection.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive(hirnSection.path)
                    ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-400 ring-1 ring-purple-500/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10'
                }`}
                title={sidebarCollapsed ? 'Hirn AI' : undefined}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Hirn AI</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">KI-Assistent</p>
                  </div>
                )}
              </Link>
            </div>
          )}

          {/* User-facing site links */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                <User className="w-5 h-5 flex-shrink-0" />
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
              {/* View Site Button */}
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Globe className="w-4 h-4" />
                Website
              </Link>

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-3 p-1.5 pr-3 rounded-full transition-all duration-200 ${
                    userMenuOpen
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name || 'Staff'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 hidden sm:block ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-64 transition-all duration-200 ease-out origin-top-right ${
                    userMenuOpen
                      ? 'opacity-100 scale-100 pointer-events-auto'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user?.name || 'Staff'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* View Website */}
                      <Link
                        href="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                        Zur Website
                      </Link>

                      {/* Theme Toggle */}
                      <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {theme === 'dark' ? (
                            <Sun className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Moon className="w-4 h-4 text-gray-400" />
                          )}
                          Dark Mode
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full transition-colors ${
                            theme === 'dark' ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                              theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="py-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Abmelden
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
