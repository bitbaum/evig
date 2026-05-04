'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, RefreshCw, X } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import type { Pool } from './types'
import { CATEGORY_EMOJIS } from './types'

interface Props {
  onClose: () => void
  onCreate: (pool: Pool) => void
}

export function CreatePoolModal({ onClose, onCreate }: Props) {
  const t = useTranslations('abos')
  const [form, setForm] = useState({
    serviceName: '',
    serviceCategory: 'streaming',
    maxMembers: 4,
    monthlyCostChf: '',
    description: '',
    rules: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<Pool>('/api/pools', {
        method: 'POST',
        body: {
          ...form,
          maxMembers: Number(form.maxMembers),
          monthlyCostChf: Number(form.monthlyCostChf),
        },
      })
      if (!result.success || !result.data) throw new Error(result.error ?? 'Error')
      onCreate(result.data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modal.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{t('modal.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-xl text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('modal.serviceName')}</label>
            <input
              required
              value={form.serviceName}
              onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
              placeholder={t('modal.serviceNamePlaceholder')}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('modal.category')}</label>
              <select
                value={form.serviceCategory}
                onChange={e => setForm(f => ({ ...f, serviceCategory: e.target.value }))}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.keys(CATEGORY_EMOJIS).map(val => (
                  // @ts-expect-error — dynamic category key
                  <option key={val} value={val}>{CATEGORY_EMOJIS[val]} {t(`categories.${val}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('modal.maxMembers')}</label>
              <input
                required
                type="number"
                min={2}
                max={20}
                value={form.maxMembers}
                onChange={e => setForm(f => ({ ...f, maxMembers: Number(e.target.value) }))}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('modal.monthlyCost')}</label>
            <input
              required
              type="number"
              min={1}
              step={0.05}
              value={form.monthlyCostChf}
              onChange={e => setForm(f => ({ ...f, monthlyCostChf: e.target.value }))}
              placeholder={t('modal.monthlyCostPlaceholder')}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {form.monthlyCostChf && form.maxMembers > 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                {t('modal.perPersonCalc', { amount: (Number(form.monthlyCostChf) / form.maxMembers).toFixed(2) })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('modal.description')}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder={t('modal.descriptionPlaceholder')}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('modal.rules')}</label>
            <textarea
              value={form.rules}
              onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
              rows={2}
              placeholder={t('modal.rulesPlaceholder')}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium hover:bg-neutral-50"
            >
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('modal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
