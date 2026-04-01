'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'

interface UserMenuDropdownProps {
  user: {
    name: string | null
    email: string
  } | null
}

export function UserMenuDropdown({ user }: UserMenuDropdownProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

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

      <div
        className={`absolute right-0 mt-2 w-64 transition-all duration-200 ease-out origin-top-right ${
          userMenuOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || 'Staff'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>

          <div className="py-2">
            <Link
              href="/"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              Zur Website
            </Link>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-gray-500" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-500" />
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
  )
}
