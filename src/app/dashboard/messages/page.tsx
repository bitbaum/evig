'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ConversationList from '@/components/messages/ConversationList'
import type { Conversation } from '@/components/messages/ConversationList'
import MessageThread from '@/components/messages/MessageThread'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/config/routes'

function MessagesContent() {
  const t = useTranslations('dashboard.messages')
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    searchParams.get('conversation')
  )

  // Track the selected conversation's details for the thread
  const selectedConv = conversations.find(c => c.id === selectedConvId)

  const fetchConversations = useCallback(async () => {
    try {
      const result = await apiFetch<{ conversations: Conversation[] }>('/api/messages')
      if (result.success) {
        setConversations(result.data!.conversations)
        // If deep-link param but not yet in list, keep it
        const deepLink = searchParams.get('conversation')
        if (deepLink && result.data!.conversations.some((c: Conversation) => c.id === deepLink)) {
          setSelectedConvId(deepLink)
        }
      }
    } catch (err) {
      logger.error('Failed to load conversations', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // Auth-gated data load. setState happens inside fetchConversations —
  // legitimate "subscribe to external system on session change" pattern.
   
  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    fetchConversations()
  }, [session, sessionStatus, router, fetchConversations])

  const handleSelectConversation = (id: string) => {
    setSelectedConvId(id)
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('conversation', id)
    window.history.replaceState({}, '', url.toString())
  }

  const handleBack = () => {
    setSelectedConvId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('conversation')
    window.history.replaceState({}, '', url.toString())
  }

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pageTitle')}</Heading>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {t('pageSubtitle')}
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          iconBg="bg-neutral-50 dark:bg-neutral-800"
          iconColor="text-neutral-500 dark:text-neutral-400"
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button as={Link} href={ROUTES.public.marketplace} variant="primary">
              {t('goToMarketplace')}
            </Button>
          }
        />
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Conversation list — hidden on mobile when thread is open */}
            <div className={`w-full lg:w-80 lg:border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto flex-shrink-0 ${
              selectedConvId ? 'hidden lg:block' : 'block'
            }`}>
              <ConversationList
                conversations={conversations}
                selectedId={selectedConvId}
                onSelect={handleSelectConversation}
              />
            </div>

            {/* Message thread */}
            <div className={`flex-1 ${
              selectedConvId ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'
            }`}>
              {selectedConvId && selectedConv && session?.user?.id ? (
                <MessageThread
                  conversationId={selectedConvId}
                  currentUserId={session.user.id}
                  recipientId={selectedConv.other_user_id}
                  recipientName={selectedConv.other_user_name || t('unknownRecipient')}
                  contextType={selectedConv.type}
                  contextId={selectedConv.context_id}
                  onBack={handleBack}
                />
              ) : (
                <div className="text-center text-neutral-400 dark:text-neutral-500 p-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p className="text-sm">{t('selectConversation')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" aria-hidden="true" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
