'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, MessageSquare, Loader2, ChevronRight, FileText, BarChart3 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { adminInteractive } from '@/lib/admin-ui'

interface Session {
  sessionId: string
  firstMessage: string
  lastActivity: Date
  messageCount: number
}

interface HirnSidebarProps {
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
  refreshTrigger?: number
}

export function HirnSidebar({
  currentSessionId,
  onSelectSession,
  onNewSession,
  refreshTrigger,
}: HirnSidebarProps) {
  const t = useTranslations('admin.hirn.sidebar')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    totalDocuments: number
    totalChunks: number
  } | null>(null)

  useEffect(() => {
    loadSessions()
    loadStats()
  }, [refreshTrigger])

  const loadSessions = async () => {
    try {
      const result = await apiFetch<Array<Omit<Session, 'lastActivity'> & { lastActivity: string }>>('/api/admin/hirn/history')
      if (result.success && result.data) {
        setSessions(result.data.map((s) => ({
          ...s,
          lastActivity: new Date(s.lastActivity),
        })))
      }
    } catch (err) {
      logger.error('Failed to load Hirn sessions', { error: err })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await apiFetch<{ totalDocuments: number; totalChunks: number }>('/api/admin/hirn/documents?stats=true')
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      logger.error('Failed to load Hirn stats', { error: err })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4">
        <Button onClick={onNewSession} variant="primary" className="w-full">
          <Plus className="w-4 h-4" />
          {t('newConversation')}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-surface-raised rounded-lg">
              <FileText className="w-4 h-4 text-action" />
              <div>
                <p className="text-xs text-text-tertiary">{t('documentsLabel')}</p>
                <p className="font-medium text-text-primary">{stats.totalDocuments}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-surface-raised rounded-lg">
              <BarChart3 className="w-4 h-4 text-action" />
              <div>
                <p className="text-xs text-text-tertiary">{t('chunksLabel')}</p>
                <p className="font-medium text-text-primary">{stats.totalChunks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2">
        <Heading level={3} className="px-2 py-1 text-xs font-medium text-text-tertiary uppercase">
          {t('conversationsHeading')}
        </Heading>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-4 text-sm text-text-tertiary text-center">
            {t('emptyConversations')}
          </p>
        ) : (
          <div className="space-y-1">
            {sessions.map(session => (
              <Button
                key={session.sessionId}
                variant="ghost"
                onClick={() => onSelectSession(session.sessionId)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left h-auto justify-start ${
                  currentSessionId === session.sessionId
                    ? 'bg-action-muted text-action'
                    : '${adminInteractive.rowHover} text-text-secondary'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.firstMessage.slice(0, 40)}
                    {session.firstMessage.length > 40 ? '...' : ''}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {formatRelativeTime(session.lastActivity.toISOString())} · {t('messageCount', { count: session.messageCount })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
