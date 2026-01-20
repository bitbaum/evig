'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  Brain
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const adminNavItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Benutzer',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Produkte',
      href: '/admin/products',
      icon: LayoutDashboard, // Using LayoutDashboard as a placeholder
    },
    {
      name: 'Workshops',
      href: '/admin/workshops',
      icon: Calendar,
    },
    {
      name: 'Dienstleistungen',
      href: '/admin/services',
      icon: Wrench,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      name: 'Hirn',
      href: '/admin/hirn',
      icon: Brain,
    },
    {
      name: 'Einstellungen',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

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
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Admin
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">A</span>
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
        <nav className="mt-8 px-3">
          <div className="space-y-2">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Zurück zum Dashboard' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Zurück zum Dashboard</span>}
            </Link>
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Admin User
              </span>
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  A
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
