'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, Loader2, ChevronRight, FileText, BarChart3 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { logger } from '@/lib/logger'

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
      const response = await fetch('/api/admin/hirn/history')
      const data = await response.json()
      if (data.success) {
        setSessions(data.data.map((s: Session & { lastActivity?: string }) => ({
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
      const response = await fetch('/api/admin/hirn/documents?stats=true')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      logger.error('Failed to load Hirn stats', { error: err })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Gespräch
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <FileText className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Dokumente</p>
                <p className="font-medium text-gray-900 dark:text-white">{stats.totalDocuments}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Chunks</p>
                <p className="font-medium text-gray-900 dark:text-white">{stats.totalChunks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2">
        <h3 className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
          Gespräche
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-4 text-sm text-gray-500 text-center">
            Keine Gespräche vorhanden
          </p>
        ) : (
          <div className="space-y-1">
            {sessions.map(session => (
              <button
                key={session.sessionId}
                onClick={() => onSelectSession(session.sessionId)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                  currentSessionId === session.sessionId
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.firstMessage.slice(0, 40)}
                    {session.firstMessage.length > 40 ? '...' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(session.lastActivity.toISOString())} · {session.messageCount} Nachrichten
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
