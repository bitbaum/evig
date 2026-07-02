'use client'

/**
 * HirnChatPanel — shared slide-over chat UI for the public Hirn assistant.
 *
 * Page context (description, suggestion chips, quick actions) comes from the
 * SSOT in src/config/hirn/page-contexts.ts. Messages go to /api/hirn/chat
 * with the current pathname; history is client-held (nothing persisted).
 * Unauthenticated visitors see a login prompt + the context quick actions.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Brain, Loader2, Send, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { withClientCsrfHeader } from '@/lib/api/csrf-client'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'
import type { HirnPageContext } from '@/config/hirn/page-contexts'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface HirnChatPanelProps {
  isOpen: boolean
  onClose: () => void
  context: HirnPageContext
  pathname: string
  isAuthenticated: boolean
}

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** Render assistant text, turning markdown links into real links. */
function renderAssistantContent(content: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  MARKDOWN_LINK.lastIndex = 0
  while ((match = MARKDOWN_LINK.exec(content)) !== null) {
    if (match.index > lastIndex) nodes.push(content.slice(lastIndex, match.index))
    const [, label, href] = match
    nodes.push(
      href.startsWith('/') ? (
        <Link key={match.index} href={href} className="underline font-medium">
          {label}
        </Link>
      ) : (
        <a key={match.index} href={href} className="underline font-medium" target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      )
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) nodes.push(content.slice(lastIndex))
  return nodes
}

function QuickActions({ actions }: { actions: NonNullable<HirnPageContext['quickActions']> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <Link
          key={action.href}
          href={action.href}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-strong text-text-primary hover:border-action hover:text-action transition-colors"
        >
          {action.label}
        </Link>
      ))}
    </div>
  )
}

export function HirnChatPanel({ isOpen, onClose, context, pathname, isAuthenticated }: HirnChatPanelProps) {
  const t = useTranslations('hirn')
  const tCommon = useTranslations('common')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const panelRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  // Lock body scroll while open (same pattern as the admin slide-over).
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: message }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Direct fetch (not apiFetch) so the 429 status is detectable for a
      // localized rate-limit message; CSRF header comes from the shared SSOT.
      const res = await fetch('/api/hirn/chat', {
        method: 'POST',
        headers: withClientCsrfHeader({ 'Content-Type': 'application/json' }, 'POST'),
        body: JSON.stringify({
          message,
          pathname,
          history: messages.slice(-10),
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 429) {
        setError(t('rateLimited'))
        return
      }
      if (!res.ok || !data.success || !data.data?.reply) {
        setError(typeof data.error === 'string' ? data.error : t('error'))
        return
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.data.reply }])
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const lastMessage = messages[messages.length - 1]
  const showQuickActionsAfterReply =
    !loading && lastMessage?.role === 'assistant' && (context.quickActions?.length ?? 0) > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-surface-base flex flex-col focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border bg-action">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-base/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <Heading level={2} className="font-semibold text-white">{t('title')}</Heading>
              <p className="text-xs text-white/70">{t('subtitle', { orgName: ORG.name })}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={tCommon('close')}
            className="text-white/80 hover:text-white hover:bg-surface-base/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Brain className="w-10 h-10 text-action" aria-hidden="true" />
            <p className="text-sm text-text-secondary max-w-xs">
              {t('loginPrompt', { orgName: ORG.name })}
            </p>
            <Link
              href={ROUTES.public.login}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-action text-white hover:bg-action-hover transition-colors"
            >
              {t('loginCta')}
            </Link>
            {context.quickActions && context.quickActions.length > 0 && (
              <QuickActions actions={context.quickActions} />
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <Brain className="w-10 h-10 text-action" aria-hidden="true" />
                  <div>
                    <Heading level={3} className="text-base font-medium text-text-primary">
                      {t('emptyTitle')}
                    </Heading>
                    <p className="text-sm text-text-tertiary mt-1">{t('emptyHint')}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs" aria-label={t('suggestionsLabel')}>
                    {context.suggestions.map(suggestion => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => send(suggestion)}
                        className="justify-start text-left whitespace-normal h-auto py-2"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                  {context.quickActions && context.quickActions.length > 0 && (
                    <QuickActions actions={context.quickActions} />
                  )}
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap text-sm ${
                        message.role === 'user'
                          ? 'bg-action text-white rounded-2xl rounded-br-sm px-4 py-2'
                          : 'bg-surface-raised text-text-primary rounded-2xl rounded-bl-sm px-4 py-3'
                      }`}
                    >
                      {message.role === 'assistant'
                        ? renderAssistantContent(message.content)
                        : message.content}
                    </div>
                  </div>
                ))
              )}

              {showQuickActionsAfterReply && context.quickActions && (
                <QuickActions actions={context.quickActions} />
              )}

              {loading && (
                <div className="flex" aria-label={t('thinking')}>
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
                <div id="hirn-panel-error" className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                  <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={e => {
                e.preventDefault()
                send(input)
              }}
              className="border-t border p-3"
            >
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  disabled={loading}
                  maxLength={2000}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'hirn-panel-error' : undefined}
                  className="flex-1"
                />
                <Button type="submit" variant="primary" disabled={!input.trim() || loading} aria-label={t('send')}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  )
}
