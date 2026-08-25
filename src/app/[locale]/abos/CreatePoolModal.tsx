'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Pool } from './types'
import { CATEGORY_EMOJIS, DEFAULT_CATEGORY } from './types'

interface Props {
  onClose: () => void
  onCreate: (pool: Pool) => void
}

export function CreatePoolModal({ onClose, onCreate }: Props) {
  const t = useTranslations('abos')
  const [form, setForm] = useState({
    serviceName: '',
    serviceCategory: DEFAULT_CATEGORY,
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
    // <Modal> owns the portal shell, the scrim, the focus trap and the header.
    // This used to be a hand-rolled `fixed inset-0` overlay with its own
    // useFocusTrap call and its own rounded-2xl surface — a second encoding of
    // the centered-dialog shape, which is exactly what the one-primitive-per-
    // shape rule forbids. Retheming dialogs now happens in one file.
    <Modal isOpen onClose={onClose} title={t('modal.title')}>
      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-xl text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.serviceName')}</label>
          <Input
            variant="elevated"
            required
            value={form.serviceName}
            onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
            placeholder={t('modal.serviceNamePlaceholder')}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.category')}</label>
            <Select
              variant="elevated"
              value={form.serviceCategory}
              onChange={e => setForm(f => ({ ...f, serviceCategory: e.target.value }))}
            >
              {Object.keys(CATEGORY_EMOJIS).map(val => (
                // @ts-expect-error — dynamic category key
                <option key={val} value={val}>{CATEGORY_EMOJIS[val]} {t(`categories.${val}`)}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.maxMembers')}</label>
            <Input
              variant="elevated"
              required
              type="number"
              min={2}
              max={20}
              value={form.maxMembers}
              onChange={e => setForm(f => ({ ...f, maxMembers: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.monthlyCost')}</label>
          <Input
            variant="elevated"
            required
            type="number"
            min={1}
            step={0.05}
            value={form.monthlyCostChf}
            onChange={e => setForm(f => ({ ...f, monthlyCostChf: e.target.value }))}
            placeholder={t('modal.monthlyCostPlaceholder')}
          />
          {form.monthlyCostChf && form.maxMembers > 0 && (
            <p className="text-xs text-action mt-1">
              {t('modal.perPersonCalc', { amount: (Number(form.monthlyCostChf) / form.maxMembers).toFixed(2) })}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.description')}</label>
          <Textarea
            variant="elevated"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder={t('modal.descriptionPlaceholder')}
            className="resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.rules')}</label>
          <Textarea
            variant="elevated"
            value={form.rules}
            onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
            rows={2}
            placeholder={t('modal.rulesPlaceholder')}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={onClose} variant="outline" className="flex-1">
            {t('modal.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="flex-1">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('modal.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
