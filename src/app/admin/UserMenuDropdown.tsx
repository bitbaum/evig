'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  ChevronDown,
  ExternalLink,
  LogOut,
} from 'lucide-react'
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
            ? 'bg-neutral-100 dark:bg-neutral-700'
            : 'hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
        }`}
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
          </span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            {user?.name || 'Staff'}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {user?.email}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 hidden sm:block ${
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
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-neutral-900">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {user?.name || 'Staff'}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {user?.email}
            </p>
          </div>

          <div className="py-2">
            <Link
              href="/"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.04]"
            >
              <ExternalLink className="w-4 h-4 text-neutral-500" />
              Zur Website
            </Link>

            <div className="flex w-full items-center justify-between px-4 py-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              <span>Dark Mode</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="border-t border-neutral-200 py-2 dark:border-white/[0.06]">
            <button
              onClick={() => {
                setUserMenuOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 dark:hover:text-error-400 transition-colors"
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
