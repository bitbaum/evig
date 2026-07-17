'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Loader2, Bot, User, Sparkles, Trash2, Rocket, TriangleAlert } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api/client'
import { usePathname } from 'next/navigation'
import { resolveHirnContext } from '@/config/hirn/page-contexts'
import { logger } from '@/lib/logger'
import { ORG } from '@/config/org'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface HirnActionCard {
  id: string
  type: 'create_task' | 'create_decision_draft' | 'create_protocol_draft' | 'navigate'
  title: string
  summary: string
  cta: string
  risky: boolean
  payload: Record<string, unknown>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  model?: string
  provider?: string
  actions?: HirnActionCard[]
}

interface HirnChatProps {
  sessionId: string
  onSessionChange?: () => void
  /** Compact mode for slide-over panel - smaller padding, no header */
  compact?: boolean
}

export function HirnChat({ sessionId, onSessionChange, compact = false }: HirnChatProps) {
  const t = useTranslations('admin.hirn.chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [pendingClear, setPendingClear] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history on mount or session change
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const result = await apiFetch<{ id: string; role: string; content: string; created_at?: string; createdAt?: string }[]>(`/api/admin/hirn/history?sessionId=${sessionId}`)
        if (result.success && result.data) {
          setMessages(result.data.map((m) => ({
            ...m,
            role: m.role as 'user' | 'assistant',
            createdAt: new Date(m.created_at || m.createdAt || Date.now()),
          })))
        }
      } catch {
        // New session, no history
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [sessionId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const pathname = usePathname()
  // Page context (SSOT: config/hirn/page-contexts) — tells Hirn what the
  // staff member is currently looking at + seeds the empty-state chips.
  const pageContext = resolveHirnContext(pathname ?? '/admin', 'admin')
  // Chips are UI → localized via admin.hirnContexts.<area>.sN, config German fallback.
  const tCtx = useTranslations('admin.hirnContexts')
  const localizedSuggestions = pageContext.suggestions.map((fallback, i) => {
    const key = `${pageContext.area}.s${i}`
    return tCtx.has(key as never) ? tCtx(key as never) : fallback
  })

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const result = await apiFetch<{ content: string; model?: string; provider?: string; actions?: HirnActionCard[] }>('/api/admin/hirn/chat', {
        method: 'POST',
        body: {
          message: userMessage.content,
          sessionId,
          pathname: pathname ?? undefined,
        },
      })

      if (!result.success) {
        throw new Error(result.error || t('errorSendDefault'))
      }

      const responseData = result.data!

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseData.content || t('errorEmptyResponse'),
        createdAt: new Date(),
        model: responseData.model || undefined,
        provider: responseData.provider || undefined,
        actions: responseData.actions || [],
      }

      setMessages(prev => [...prev, assistantMessage])
      setError('')  // Clear any previous error on success
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorUnknown'))
    } finally {
      setLoading(false)
    }
  }

  const clearSession = () => setPendingClear(true)

  const doClearSession = async () => {
    try {
      await apiFetch<void>(`/api/admin/hirn/history?sessionId=${sessionId}`, {
        method: 'DELETE',
      })
      setMessages([])
      onSessionChange?.()
    } catch (err) {
      logger.warn('Failed to delete Hirn chat session', { error: err })
      setError(t('errorDelete'))
    }
  }

  const executeAction = async (action: HirnActionCard) => {
    setError('')

    // Navigate actions just redirect — no API call needed
    if (action.type === 'navigate') {
      const url = typeof action.payload.url === 'string' ? action.payload.url : '/admin'
      window.location.href = url
      return
    }

    try {
      const result = await apiFetch<{ entity?: { link?: string } }>('/api/admin/hirn/actions/execute', {
        method: 'POST',
        body: {
          actionId: action.id,
          actionType: action.type,
          payload: action.payload,
          dryRun: false,
        },
      })

      if (!result.success) throw new Error(result.error || t('errorActionDefault'))

      const link = result.data?.entity?.link
      if (link) {
        window.location.href = link
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorActionDefault'))
    }
  }

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-action" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - hidden in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between p-4 border-b border">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-action" />
            <span className="font-medium text-text-primary">{t('title')}</span>
          </div>
          {messages.length > 0 && (
            <Button
              variant="destructive-ghost"
              size="sm"
              onClick={clearSession}
              className="gap-1"
            >
              <Trash2 className="w-4 h-4" />
              {t('clear')}
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-4 ${compact ? 'p-3' : 'p-4'}`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary">
            <Sparkles className="w-12 h-12 mb-4 text-action" />
            <Heading level={3} className="text-lg font-medium">{t('welcomeTitle')}</Heading>
            <p className="text-sm max-w-md mt-2">
              {t('welcomeBody', { orgName: ORG.name })}
            </p>
            {localizedSuggestions.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {localizedSuggestions.map(suggestion => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="rounded-full text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-action-muted flex items-center justify-center">
                  <Bot className="w-4 h-4 text-action" />
                </div>
              )}

              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-action text-white rounded-2xl rounded-br-sm px-4 py-2'
                    : 'bg-surface-raised text-text-primary rounded-2xl rounded-bl-sm px-4 py-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map(action => (
                      <div key={action.id} className="rounded-xl border border-strong p-3 bg-surface-base/70">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{action.title}</p>
                            <p className="text-xs text-text-secondary mt-1">{action.summary}</p>
                          </div>
                          {action.risky && <TriangleAlert className="w-4 h-4 text-warning-500" />}
                        </div>
                        <Button
                          type="button"
                          onClick={() => executeAction(action)}
                          variant="primary"
                          size="sm"
                          className="mt-3"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          {action.cta}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && message.model && (
                  <p className="mt-2 text-xs text-text-muted">
                    via {message.provider}/{message.model}
                  </p>
                )}
              </div>

              {message.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-action flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-action-muted flex items-center justify-center">
              <Bot className="w-4 h-4 text-action" />
            </div>
            <div className="bg-surface-raised rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-action rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-action rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-action rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div id="hirn-chat-error" className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
            <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className={`border-t border ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('inputPlaceholder')}
            disabled={loading}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'hirn-chat-error' : undefined}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={pendingClear}
        title={t('confirmDeleteTitle')}
        message={t('confirmDeleteMessage')}
        onConfirm={() => { setPendingClear(false); doClearSession() }}
        onClose={() => setPendingClear(false)}
      />
    </div>
  )
}
