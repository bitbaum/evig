'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { RELATED_TYPE_HREFS } from '@/config/notifications'

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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.floor(hours / 24)
  return `vor ${days} Tag${days !== 1 ? 'en' : ''}`
}

function relatedHref(notification: Notification): string | null {
  const { related_type, related_id } = notification
  if (!related_type || !related_id) return null
  const base = RELATED_TYPE_HREFS[related_type]
  return base ? `${base}${related_id}` : null
}

export function NotificationBell() {
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
      setError(result.error || 'Benachrichtigungen konnten nicht geladen werden')
    }
    setLoading(false)
  }, [])

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
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ''}`}
      >
        <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-error-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
            <span className="font-semibold text-sm text-neutral-900 dark:text-white">
              Benachrichtigungen
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-error-100 text-error-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  title="Alle als gelesen markieren"
                >
                  <Check className="w-3 h-3" />
                  Alle gelesen
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
            {error && notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-error-500 dark:text-error-400 mb-2">{error}</p>
                <button
                  onClick={() => void fetchNotifications()}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-500">
                Laden…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-neutral-200 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Keine Benachrichtigungen</p>
              </div>
            ) : (
              notifications.map(n => {
                const href = relatedHref(n)
                return (
                  <button
                    key={n.id}
                    onClick={() => void markOneRead(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                      !n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                      <div className={!n.is_read ? '' : 'pl-4'}>
                        <p className={`text-sm leading-snug ${
                          !n.is_read
                            ? 'font-semibold text-neutral-900 dark:text-white'
                            : 'font-medium text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                          {n.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500">
                            {relativeTime(n.created_at)}
                          </span>
                          {href && (
                            <span className="text-xs text-blue-500">Öffnen →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
