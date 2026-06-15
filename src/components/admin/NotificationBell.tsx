'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bell, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { RELATED_TYPE_HREFS } from '@/config/notifications'
import { adminInteractive } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  related_type: string | null
  related_id: string | null
  is_read: boolean
  created_at: string
}

type RelativeTimeFormatter = (iso: string) => string

function makeRelativeTime(t: ReturnType<typeof useTranslations>): RelativeTimeFormatter {
  return (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t('relativeJustNow')
    if (minutes < 60) return t('relativeMinutes', { count: minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('relativeHours', { count: hours })
    const days = Math.floor(hours / 24)
    return t('relativeDays', { count: days })
  }
}

function relatedHref(notification: Notification): string | null {
  const { related_type, related_id } = notification
  if (!related_type || !related_id) return null
  const base = RELATED_TYPE_HREFS[related_type]
  return base ? `${base}${related_id}` : null
}

export function NotificationBell() {
  const t = useTranslations('admin.notifications')
  const relativeTime = makeRelativeTime(t)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await apiFetch<{ notifications: Notification[]; unreadCount: number }>('/api/notifications')
    if (result.success && result.data) {
      setNotifications(result.data.notifications)
      setUnreadCount(result.data.unreadCount)
    } else {
      setError(result.error || t('loadError'))
    }
    setLoading(false)
  }, [t])

  // Fetch on mount and every 60 seconds for live badge updates
  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await apiFetch<{ notifications: Notification[]; unreadCount: number }>('/api/notifications')
      if (cancelled) return
      if (result.success && result.data) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unreadCount)
      }
    }
    load()
    const interval = setInterval(() => { load() }, 60000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) void fetchNotifications()
  }

  const markOneRead = async (notification: Notification) => {
    if (!notification.is_read) {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      const result = await apiFetch<void>(`/api/notifications/${notification.id}`, { method: 'PATCH' })
      if (!result.success) void fetchNotifications()
    }

    const href = relatedHref(notification)
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    const result = await apiFetch<void>('/api/notifications', { method: 'PATCH' })
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } else {
      void fetchNotifications()
    }
    setMarkingAll(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className={`relative w-9 h-9 rounded-lg ${adminInteractive.rowHover}`}
        aria-label={unreadCount > 0 ? t('bellAriaWithUnread', { count: unreadCount }) : t('bellAriaLabel')}
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-error-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border bg-surface-base shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-subtle px-4 py-3 dark:border-white/6">
            <span className="font-semibold text-sm text-text-primary">
              {t('title')}
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-error-100 text-error-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-tertiary ${adminInteractive.rowHover} hover:text-text-secondary h-auto`}
                  title={t('markAllRead')}
                >
                  <Check className="w-3 h-3" />
                  {t('markAllReadShort')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className={`rounded-md p-1 ${adminInteractive.rowHover} h-auto w-auto`}
              >
                <X className="w-4 h-4 text-text-tertiary" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] divide-y overflow-y-auto divide-subtle">
            {error && notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-error-500 dark:text-error-400 mb-2">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchNotifications()}
                  className="text-xs text-action hover:text-action h-auto px-0 bg-transparent hover:bg-transparent"
                >
                  {t('retry')}
                </Button>
              </div>
            ) : loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-tertiary">
                {t('loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-text-muted dark:text-text-secondary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">{t('empty')}</p>
              </div>
            ) : (
              notifications.map(n => {
                const href = relatedHref(n)
                return (
                  <Button
                    key={n.id}
                    variant="ghost"
                    onClick={() => void markOneRead(n)}
                    className={cn(
                      'w-full text-left px-4 py-3 h-auto rounded-none justify-start',
                      adminInteractive.rowHover,
                      !n.is_read && adminInteractive.unreadTint,
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-action" />
                      )}
                      <div className={!n.is_read ? '' : 'pl-4'}>
                        <p className={`text-sm leading-snug ${
                          !n.is_read
                            ? 'font-semibold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                          {n.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-tertiary">
                            {relativeTime(n.created_at)}
                          </span>
                          {href && (
                            <span className="text-xs text-action">{t('open')} →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
