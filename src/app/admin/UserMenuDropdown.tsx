'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  ChevronDown,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface UserMenuDropdownProps {
  user: {
    name: string | null
    email: string
  } | null
}

export function UserMenuDropdown({ user }: UserMenuDropdownProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className={`flex items-center gap-3 p-1.5 pr-3 rounded-full transition-all duration-200 ${
          userMenuOpen
            ? 'bg-surface-raised'
            : 'hover:bg-surface-raised dark:hover:bg-surface-base/6'
        }`}
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        <div className="w-9 h-9 bg-action rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
          </span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-text-primary">
            {user?.name || 'Staff'}
          </p>
          <p className="text-xs text-text-secondary">
            {user?.email}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-tertiary transition-transform duration-200 hidden sm:block ${
            userMenuOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`absolute right-0 mt-2 w-64 transition-all duration-200 ease-out origin-top-right ${
          userMenuOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden rounded-xl border border bg-surface-base shadow-xl">
          <div className="border-b border bg-surface-raised px-4 py-3 dark:bg-surface-base/3">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user?.name || 'Staff'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user?.email}
            </p>
          </div>

          <div className="py-2">
            <Link
              href={ROUTES.public.home}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-raised dark:hover:bg-surface-base/4"
            >
              <ExternalLink className="w-4 h-4 text-text-tertiary" />
              Zur Website
            </Link>

            <div className="flex w-full items-center justify-between px-4 py-1.5 text-sm text-text-secondary">
              <span>Dark Mode</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="border-t border py-2">
            <button
              onClick={() => {
                setUserMenuOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 dark:hover:text-error-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
