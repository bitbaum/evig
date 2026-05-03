'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
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
  Wrench,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

/**
 * UserMenu Component
 * - Subtle text links for login/register when logged out
 * - Single primary CTA (Registrieren)
 * - Elegant dropdown when logged in
 */
export function UserMenu() {
  const t = useTranslations('components.userMenu')
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
            "hidden sm:inline-flex px-4 py-2 text-sm font-medium text-neutral-600",
            "hover:text-neutral-900 transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
          )}
        >
          {t('login')}
        </Link>
        <Link
          href="/auth/register"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium",
            "bg-primary-600 text-white rounded-lg",
            "hover:bg-primary-700 transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
            "shadow-sm hover:shadow"
          )}
        >
          {t('register')}
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
      ...(isStaff ? [{ href: '/admin', icon: Shield, label: t('admin'), highlight: true }] : []),
      { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
      { href: '/dashboard/profile', icon: User, label: t('myProfile') },
      { href: '/dashboard/messages', icon: MessageSquare, label: t('messages') },
      { href: '/dashboard/membership', icon: BadgeCheck, label: t('membership') },
    ],
    // Marketplace
    [
      { href: '/dashboard/listings', icon: Store, label: t('myListings') },
      { href: '/dashboard/orders', icon: ShoppingBag, label: t('myOrders') },
    ],
    // Services
    [
      { href: '/dashboard/appointments', icon: Calendar, label: t('myAppointments') },
      { href: '/dashboard/workshops', icon: Calendar, label: t('myWorkshops') },
      { href: '/dashboard/bookings', icon: Wrench, label: t('myBookings') },
    ],
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1.5 rounded-full",
          "transition-all duration-200",
          "ring-2 ring-primary-100",
          isOpen
            ? "bg-primary-50 ring-primary-200"
            : "hover:bg-primary-50 hover:ring-primary-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`${session.user.name || session.user.email} - ${t('accountMenu')}`}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || t('profilePicture')}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full ring-2 ring-white"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white">
            {initials}
          </div>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-neutral-500 transition-transform duration-200",
            isOpen && "rotate-180 text-primary-600"
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
        <div className="bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
          {/* User Info Header */}
          <div className="px-5 py-4 bg-gradient-to-br from-neutral-50 to-white border-b border-neutral-100">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || t('profilePicture')}
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
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {session.user.name || t('user')}
                </p>
                <p className="text-xs text-neutral-500 truncate">
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
                  <div className="my-1 mx-3 border-t border-neutral-100" />
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
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors",
                      'highlight' in item && item.highlight
                        ? "text-amber-600"
                        : "text-neutral-400 group-hover:text-emerald-600"
                    )} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Settings & Logout */}
          <div className="py-2 border-t border-neutral-100">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-5 py-2.5",
                "text-sm text-neutral-600 hover:text-neutral-900",
                "hover:bg-neutral-50 transition-colors duration-150"
              )}
            >
              <Settings className="w-4 h-4 text-neutral-500 group-hover:text-emerald-600 transition-colors" />
              {t('settings')}
            </Link>
            <button
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className={cn(
                "group flex items-center gap-3 w-full px-5 py-2.5",
                "text-sm text-neutral-600 hover:text-red-600",
                "hover:bg-red-50 transition-colors duration-150"
              )}
            >
              <LogOut className="w-4 h-4 text-neutral-500 group-hover:text-red-500 transition-colors" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
