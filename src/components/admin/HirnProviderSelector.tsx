'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Check, Loader2, Cpu, Cloud, Zap, X, Key, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import { apiFetch } from '@/lib/api/client'

interface Provider {
  provider: string
  isEnabled: boolean
  isDefault: boolean
  isAvailable: boolean
  model: string
  description?: string
}

type ProviderCategory = 'local' | 'free'

interface ProviderMeta {
  label: string
  icon: typeof Cpu
  color: string
  bgColor: string
  category: ProviderCategory
  description: string
  keyName: string
  keyUrl?: string
  keyPrefix?: string
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  ollama: {
    label: 'Ollama',
    icon: Cpu,
    color: 'text-action',
    bgColor: 'bg-action-muted-muted',
    category: 'local',
    description: 'Lokal, kostenlos, privat',
    keyName: '',
    keyUrl: 'https://ollama.ai',
  },
  groq: {
    label: 'Groq',
    icon: Zap,
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-100 dark:bg-secondary-900/30',
    category: 'free',
    description: 'Gratis, ultra-schnell',
    keyName: 'GROQ_API_KEY',
    keyUrl: 'https://console.groq.com/keys',
    keyPrefix: 'gsk_',
  },
  openrouter: {
    label: 'OpenRouter',
    icon: Cloud,
    color: 'text-action',
    bgColor: 'bg-action-muted-muted',
    category: 'free',
    description: 'Viele Modelle, pay-per-use',
    keyName: 'OPENROUTER_API_KEY',
    keyUrl: 'https://openrouter.ai/keys',
    keyPrefix: 'sk-or-',
  },
}

const CATEGORIES: { id: ProviderCategory; label: string; description: string }[] = [
  { id: 'local', label: 'Lokal', description: 'Auf deinem Computer' },
  { id: 'free', label: 'Gratis / Pay-per-use', description: 'Cloud APIs' },
]

export function HirnProviderSelector() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const loadProviders = useCallback(async () => {
    const result = await apiFetch<Provider[]>('/api/admin/hirn/providers')
    if (result.success && result.data) {
      setProviders(result.data)
    } else {
      setError(result.error || 'Fehler beim Laden')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await apiFetch<Provider[]>('/api/admin/hirn/providers')
      if (cancelled) return
      if (result.success && result.data) {
        setProviders(result.data)
      } else {
        setError(result.error || 'Fehler beim Laden')
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const setDefaultProvider = async (provider: string) => {
    setChanging(true)
    setError('')
    const result = await apiFetch<void>('/api/admin/hirn/providers', {
      method: 'PATCH',
      body: { provider, isDefault: true },
    })
    if (result.success) {
      await loadProviders()
      setOpen(false)
    } else {
      setError(result.error || 'Fehler')
    }
    setChanging(false)
  }


  const saveApiKey = async (provider: string, currentValue = '') => {
    const nextKey = window.prompt('API-Key eingeben', currentValue)
    if (nextKey === null) return

    setChanging(true)
    setError('')
    const result = await apiFetch<void>('/api/admin/hirn/providers', {
      method: 'PATCH',
      body: { provider, apiKey: nextKey },
    })
    if (result.success) {
      await loadProviders()
    } else {
      setError(result.error || 'API-Key konnte nicht gespeichert werden')
    }
    setChanging(false)
  }

  const currentProvider = providers.find(p => p.isDefault)
  const currentMeta = currentProvider ? PROVIDER_META[currentProvider.provider] : null

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface-base border border hover:border-strong dark:hover:border-action rounded-xl transition-all shadow-xs"
      >
        {currentMeta ? (
          <>
            <div className={`p-1.5 rounded-lg ${currentMeta.bgColor}`}>
              <currentMeta.icon className={`w-4 h-4 ${currentMeta.color}`} />
            </div>
            <div className="text-left">
              <div className="font-medium text-text-primary">
                {currentMeta.label}
              </div>
              <div className="text-xs text-text-tertiary">{currentProvider?.model}</div>
            </div>
          </>
        ) : (
          <span className="text-text-tertiary">Kein Provider</span>
        )}
        <Settings className="w-4 h-4 text-text-tertiary ml-1" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-surface-base rounded-2xl shadow-2xl border border z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-subtle dark:border-white/6">
              <div>
                <Heading level={3} className="font-semibold text-text-primary">Wähle dein Gehirn</Heading>
                <p className="text-xs text-text-tertiary mt-0.5">Welche KI soll antworten?</p>
              </div>
              <Button onClick={() => setOpen(false)} variant="ghost" size="icon" className="text-text-tertiary">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Provider List by Category */}
            <div className="max-h-[60vh] overflow-y-auto">
              {CATEGORIES.map(category => {
                const categoryProviders = providers.filter(
                  p => PROVIDER_META[p.provider]?.category === category.id
                )
                if (categoryProviders.length === 0) return null

                return (
                  <div key={category.id} className="p-2">
                    <div className="px-2 py-1 mb-1">
                      <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        {category.label}
                      </span>
                      <span className="text-xs text-text-tertiary ml-2">{category.description}</span>
                    </div>

                    <div className="space-y-1">
                      {categoryProviders.map(provider => {
                        const meta = PROVIDER_META[provider.provider]
                        if (!meta) return null
                        const isSelected = provider.isDefault
                        const canSelect = provider.isAvailable

                        return (
                          <button
                            key={provider.provider}
                            onClick={() => canSelect && setDefaultProvider(provider.provider)}
                            disabled={changing || !canSelect}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-action-muted-muted border-2 border-strong'
                                : canSelect
                                ? 'hover:bg-surface-raised dark:hover:bg-surface-base/[0.06]/50 border-2 border-transparent'
                                : 'opacity-50 cursor-not-allowed border-2 border-transparent'
                            }`}
                          >
                            <div className={`p-2 rounded-xl ${meta.bgColor}`}>
                              <meta.icon className={`w-5 h-5 ${meta.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary">
                                  {meta.label}
                                </span>
                                {isSelected && (
                                  <span className="flex items-center gap-1 text-xs text-action bg-action-muted px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-text-tertiary mt-0.5">
                                {meta.description} · {provider.model}
                              </div>
                            </div>

                            {meta.keyName && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void saveApiKey(provider.provider)
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-action hover:text-action bg-action-muted-muted rounded-lg"
                                >
                                  <Key className="w-3 h-3" />
                                  Key speichern
                                </button>
                                {meta.keyUrl && (
                                  <a
                                    href={meta.keyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-action hover:text-action bg-action-muted-muted rounded-lg"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            {error && (
              <div className="p-3 mx-3 mb-3 bg-error-50 dark:bg-error-900/20 text-error-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="p-3 bg-surface-raised border-t border-subtle dark:border-white/6">
              <p className="text-xs text-text-tertiary text-center">
                Wähle einen Provider mit aktivem API-Key
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
