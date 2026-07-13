'use client'

import { useState, useRef, useEffect } from 'react'
import { adminInteractive } from '@/lib/admin-ui'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  ChevronDown,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

interface UserMenuDropdownProps {
  user: {
    name: string | null
    email: string
  } | null
}

export function UserMenuDropdown({ user }: UserMenuDropdownProps) {
  const t = useTranslations('admin.userMenu')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const displayName = user?.name || t('staffFallback')

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
      <Button
        variant="ghost"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className={`flex items-center gap-3 rounded-full p-1.5 pr-3 transition-all duration-200 ${
          userMenuOpen ? 'bg-surface-raised' : adminInteractive.rowHover
        }`}
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-action">
          <span className="text-sm font-medium text-white">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
          </span>
        </div>
        <div className="hidden max-w-[16rem] text-right sm:block">
          <p className="truncate text-sm font-medium text-text-primary">
            {displayName}
          </p>
          {/* The email is the widest element in the bar; keep it for xl+ where
              there's room, hide it below to avoid crowding the breadcrumb. */}
          <p className="hidden truncate text-xs text-text-secondary xl:block">
            {user?.email}
          </p>
        </div>
        <ChevronDown
          className={`hidden h-4 w-4 text-text-tertiary transition-transform duration-200 sm:block ${
            userMenuOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      <div
        className={`absolute right-0 mt-2 w-64 origin-top-right transition-all duration-200 ease-out ${
          userMenuOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="overflow-hidden rounded-xl border border bg-surface-base shadow-xs">
          <div className="border-b border bg-surface-raised px-4 py-3 dark:bg-surface-base/3">
            <p className="truncate text-sm font-semibold text-text-primary">
              {displayName}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {user?.email}
            </p>
          </div>

          <div className="py-2">
            <Link
              href={ROUTES.public.home}
              onClick={() => setUserMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors ${adminInteractive.rowHoverSubtle} lg:hidden`}
            >
              <ExternalLink className="h-4 w-4 text-text-tertiary" />
              {t('toWebsite')}
            </Link>
          </div>

          <div className="border-t border py-2">
            <Button
              variant="destructive-ghost"
              onClick={() => {
                setUserMenuOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
