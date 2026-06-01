/**
 * Admin Hirn Page - Pure AI Chat Interface
 *
 * Main entry point for Hirn AI assistant.
 * Transformed from BI dashboard to pure AI chat.
 * Protected by role-based access control.
 */

'use client'

import { useState, useCallback } from 'react'
import { Brain } from 'lucide-react'
import { HirnChat } from '@/components/admin/HirnChat'
import { HirnSidebar } from '@/components/admin/HirnSidebar'
import { HirnProviderSelector } from '@/components/admin/HirnProviderSelector'
import Heading from '@/components/admin/AdminHeading'
import { ORG } from '@/config/org'

function generateSessionId(): string {
  return crypto.randomUUID()
}

export default function HirnPageClient() {
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
      <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">Hirn AI</Heading>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              KI-Assistent mit {ORG.name} Dokumentation und Code-Kontext
            </p>
          </div>
        </div>
        <HirnProviderSelector />
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-5rem)]">
        {/* Sidebar */}
        <div className="w-72 border-r border-neutral-200 dark:border-white/[0.06] bg-neutral-50 dark:bg-neutral-900">
          <HirnSidebar
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white dark:bg-neutral-900">
          <HirnChat
            sessionId={currentSessionId}
            onSessionChange={handleSessionChange}
          />
        </div>
      </div>
    </div>
  )
}
