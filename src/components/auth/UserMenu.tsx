'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  ChevronDown,
  ArrowRight,
  Shield,
  Store,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * UserMenu Component
 * - Subtle text links for login/register when logged out
 * - Single primary CTA (Registrieren)
 * - Elegant dropdown when logged in
 */
export function UserMenu() {
  // Use session hook with non-blocking configuration
  // This ensures buttons show immediately even if session check is slow
  // Critical for local hosting where DB connections can be slow
  const { data: session, status } = useSession({
    required: false, // Don't require session for this component
  })
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // CRITICAL: Always show buttons immediately - don't wait for session check
  // Session check happens in background and UI updates when ready
  // This prevents blocking page loads, especially on slow local connections
  // Show login/register buttons if: loading OR no session
  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className={cn(
            "hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600",
            "hover:text-gray-900 transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
          )}
        >
          Anmelden
        </Link>
        <Link
          href="/auth/register"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium",
            "bg-green-600 text-white rounded-lg",
            "hover:bg-green-700 transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2",
            "shadow-sm hover:shadow"
          )}
        >
          Registrieren
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  // Logged in - Show avatar with dropdown
  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || session.user.email?.charAt(0).toUpperCase() || 'U'

  // Build menu item groups - include admin link for staff members
  const isStaff = session.user.isStaff

  // Groups are rendered with visual separators between them
  const menuGroups = [
    // Core navigation
    [
      ...(isStaff ? [{ href: '/admin', icon: Shield, label: 'Admin-Bereich', highlight: true }] : []),
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/profile', icon: User, label: 'Mein Profil' },
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Nachrichten' },
    ],
    // Marketplace
    [
      { href: '/dashboard/listings', icon: Store, label: 'Meine Inserate' },
      { href: '/dashboard/orders', icon: ShoppingBag, label: 'Meine Bestellungen' },
    ],
    // Services
    [
      { href: '/dashboard/appointments', icon: Calendar, label: 'Meine Termine' },
      { href: '/dashboard/workshops', icon: Calendar, label: 'Meine Workshops' },
    ],
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1.5 rounded-full",
          "transition-all duration-200",
          "ring-2 ring-green-100",
          isOpen
            ? "bg-green-50 ring-green-200"
            : "hover:bg-green-50 hover:ring-green-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`${session.user.name || session.user.email} - Konto-Menü`}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'Profilbild'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full ring-2 ring-white"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white">
            {initials}
          </div>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180 text-green-600"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute right-0 mt-2 w-72",
          "transition-all duration-200 ease-out origin-top-right",
          isOpen 
            ? "opacity-100 scale-100 pointer-events-auto" 
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* User Info Header */}
          <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Profilbild'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {session.user.name || 'RevampIT Benutzer'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {groupIndex > 0 && (
                  <div className="my-1 mx-3 border-t border-gray-100" />
                )}
                {group.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-5 py-2.5",
                      "text-sm transition-colors duration-150",
                      'highlight' in item && item.highlight
                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors",
                      'highlight' in item && item.highlight
                        ? "text-amber-600"
                        : "text-gray-400 group-hover:text-emerald-600"
                    )} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Settings & Logout */}
          <div className="py-2 border-t border-gray-100">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-5 py-2.5",
                "text-sm text-gray-600 hover:text-gray-900",
                "hover:bg-gray-50 transition-colors duration-150"
              )}
            >
              <Settings className="w-4 h-4 text-gray-500 group-hover:text-emerald-600 transition-colors" />
              Einstellungen
            </Link>
            <button
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className={cn(
                "group flex items-center gap-3 w-full px-5 py-2.5",
                "text-sm text-gray-600 hover:text-red-600",
                "hover:bg-red-50 transition-colors duration-150"
              )}
            >
              <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
