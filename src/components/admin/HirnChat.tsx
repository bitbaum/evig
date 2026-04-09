'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles, Trash2, Rocket, TriangleAlert } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { apiFetch } from '@/lib/api/client'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
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
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Senden')
      }

      const responseData = result.data!

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseData.content || 'Keine Antwort erhalten.',
        createdAt: new Date(),
        model: responseData.model || undefined,
        provider: responseData.provider || undefined,
        actions: responseData.actions || [],
      }

      setMessages(prev => [...prev, assistantMessage])
      setError('')  // Clear any previous error on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const clearSession = async () => {
    if (!confirm('Möchtest du dieses Gespräch wirklich löschen?')) return

    try {
      await apiFetch<void>(`/api/admin/hirn/history?sessionId=${sessionId}`, {
        method: 'DELETE',
      })
      setMessages([])
      onSessionChange?.()
    } catch {
      setError('Fehler beim Löschen')
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

      if (!result.success) throw new Error(result.error || 'Aktion fehlgschlage')

      const link = result.data?.entity?.link
      if (link) {
        window.location.href = link
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgschlage')
    }
  }

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - hidden in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900 dark:text-white">Hirn Assistant</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearSession}
              className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-4 ${compact ? 'p-3' : 'p-4'}`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <Sparkles className="w-12 h-12 mb-4 text-purple-500" />
            <Heading level={3} className="text-lg font-medium">Willkommen bei Hirn</Heading>
            <p className="text-sm max-w-md mt-2">
              Stelle Fragen zu RevampIT — ich kenne unsere Mission, Geschichte, Zahlen,
              Dienstleistungen und Preise und helfe dir gerne weiter.
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}

              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm px-4 py-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map(action => (
                      <div key={action.id} className="rounded-xl border border-purple-200 dark:border-purple-700 p-3 bg-white/70 dark:bg-gray-900/40">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{action.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{action.summary}</p>
                          </div>
                          {action.risky && <TriangleAlert className="w-4 h-4 text-amber-500" />}
                        </div>
                        <button
                          type="button"
                          onClick={() => executeAction(action)}
                          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          {action.cta}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && message.model && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    via {message.provider}/{message.model}
                  </p>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div id="hirn-chat-error" className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className={`border-t border-gray-200 dark:border-gray-700 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Stelle eine Frage..."
            disabled={loading}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'hirn-chat-error' : undefined}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
