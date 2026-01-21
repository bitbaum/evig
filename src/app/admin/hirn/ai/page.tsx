'use client'

import { useState, useCallback } from 'react'
import { Brain } from 'lucide-react'
import { HirnChat } from '@/components/admin/HirnChat'
import { HirnSidebar } from '@/components/admin/HirnSidebar'
import { HirnProviderSelector } from '@/components/admin/HirnProviderSelector'

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function HirnAIPage() {
  const [currentSessionId, setCurrentSessionId] = useState<string>(generateSessionId())
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleNewSession = useCallback(() => {
    setCurrentSessionId(generateSessionId())
  }, [])

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
  }, [])

  const handleSessionChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hirn AI</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              KI-Assistent mit RevampIT Dokumentation und Code-Kontext
            </p>
          </div>
        </div>
        <HirnProviderSelector />
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-5rem)]">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <HirnSidebar
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white dark:bg-gray-800">
          <HirnChat
            sessionId={currentSessionId}
            onSessionChange={handleSessionChange}
          />
        </div>
      </div>
    </div>
  )
}
