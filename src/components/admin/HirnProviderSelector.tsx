'use client'

import { useState, useEffect } from 'react'
import { Settings, Check, Loader2, Cpu, Cloud, Zap, X, Key, ExternalLink } from 'lucide-react'

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
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    category: 'local',
    description: 'Lokal, kostenlos, privat',
    keyName: '',
    keyUrl: 'https://ollama.ai',
  },
  groq: {
    label: 'Groq',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    category: 'free',
    description: 'Gratis, ultra-schnell',
    keyName: 'GROQ_API_KEY',
    keyUrl: 'https://console.groq.com/keys',
    keyPrefix: 'gsk_',
  },
  openrouter: {
    label: 'OpenRouter',
    icon: Cloud,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
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

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/admin/hirn/providers')
      const data = await response.json()
      if (data.success) {
        setProviders(data.data)
      }
    } catch {
      setError('Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const setDefaultProvider = async (provider: string) => {
    setChanging(true)
    setError('')
    try {
      const response = await fetch('/api/admin/hirn/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, isDefault: true }),
      })
      const data = await response.json()
      if (data.success) {
        await loadProviders()
        setOpen(false)
      } else {
        setError(data.error || 'Fehler')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setChanging(false)
    }
  }

  const currentProvider = providers.find(p => p.isDefault)
  const currentMeta = currentProvider ? PROVIDER_META[currentProvider.provider] : null

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl transition-all shadow-sm"
      >
        {currentMeta ? (
          <>
            <div className={`p-1.5 rounded-lg ${currentMeta.bgColor}`}>
              <currentMeta.icon className={`w-4 h-4 ${currentMeta.color}`} />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                {currentMeta.label}
              </div>
              <div className="text-xs text-gray-500">{currentProvider?.model}</div>
            </div>
          </>
        ) : (
          <span className="text-gray-500">Kein Provider</span>
        )}
        <Settings className="w-4 h-4 text-gray-400 ml-1" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Wähle dein Gehirn</h3>
                <p className="text-xs text-gray-500 mt-0.5">Welche KI soll antworten?</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
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
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {category.label}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{category.description}</span>
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
                                ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700'
                                : canSelect
                                ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                                : 'opacity-50 cursor-not-allowed border-2 border-transparent'
                            }`}
                          >
                            <div className={`p-2 rounded-xl ${meta.bgColor}`}>
                              <meta.icon className={`w-5 h-5 ${meta.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {meta.label}
                                </span>
                                {isSelected && (
                                  <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {meta.description} · {provider.model}
                              </div>
                            </div>

                            {!canSelect && meta.keyName && (
                              <a
                                href={meta.keyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-900/30 rounded-lg"
                              >
                                <Key className="w-3 h-3" />
                                Key
                                <ExternalLink className="w-3 h-3" />
                              </a>
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
              <div className="p-3 mx-3 mb-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Wähle einen Provider mit aktivem API-Key
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
