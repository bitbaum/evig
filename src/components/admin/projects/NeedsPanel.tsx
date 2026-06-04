'use client'

/**
 * NeedsPanel — admin CRUD for project_needs.
 *
 * Receives a `t` translator scoped to `admin.projects` and resolves every
 * label inline. No props-bag intermediate.
 */

import { useState, useTransition, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NEED_TYPES, NEED_STATUSES, type NeedType, type NeedStatus } from '@/config/projects'
import { Plus, Trash2, Save } from 'lucide-react'

interface Need {
  id: string
  projectId: string
  type: string
  title: string
  description: string | null
  targetQuantity: number | null
  targetUnit: string | null
  status: string
  sortOrder: number
}

interface Props {
  slug: string
  initialNeeds: Need[]
}

export function NeedsPanel({ slug, initialNeeds }: Props) {
  // useTranslations does not type-check arbitrary nested keys past the first
  // segment cleanly — cast at the call boundary, keep static keys below.
  const t = useTranslations('admin.projects' as never) as (k: string) => string

  const [needs, setNeeds] = useState<Need[]>(initialNeeds)
  const [adding, setAdding] = useState(false)
  const [pending, startTransition] = useTransition()

  function patch(id: string, changes: Partial<Need>) {
    setNeeds(prev => prev.map(n => (n.id === id ? { ...n, ...changes } : n)))
  }

  async function save(need: Need) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(slug)}/needs/${need.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: need.type,
          title: need.title,
          description: need.description,
          targetQuantity: need.targetQuantity,
          targetUnit: need.targetUnit,
          status: need.status,
          sortOrder: need.sortOrder,
        }),
      })
      if (!res.ok) alert(t('needs.errorSave'))
    })
  }

  async function remove(id: string) {
    if (!confirm(t('needs.confirmDelete'))) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(slug)}/needs/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert(t('needs.errorDelete'))
        return
      }
      setNeeds(prev => prev.filter(n => n.id !== id))
    })
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      type: String(form.get('type') || NEED_TYPES.EXPERTISE) as NeedType,
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim(),
      targetQuantity: form.get('targetQuantity') ? Number(form.get('targetQuantity')) : null,
      targetUnit: String(form.get('targetUnit') || '').trim(),
      sortOrder: needs.length * 10,
    }
    if (!payload.title) return

    const res = await fetch(`/api/admin/projects/${encodeURIComponent(slug)}/needs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      alert(t('needs.errorCreate'))
      return
    }
    setNeeds(prev => [...prev, json.data as Need])
    setAdding(false)
  }

  return (
    <section className={cn(designPrimitive.surface.card, 'p-4 sm:p-5 mb-5')}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">{t('needs.title')}</h2>
          <p className="text-xs text-text-tertiary mt-0.5">{t('needs.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(v => !v)}
          className={cn(
            designPrimitive.buttonBase,
            designPrimitive.buttonSize.sm,
            designPrimitive.button.primary,
            'gap-1.5 min-h-[40px]',
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {t('needs.new')}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-5 p-3 rounded-lg border border bg-surface-raised dark:bg-white/3"
        >
          <Select name="type" variant="elevated">
            {Object.values(NEED_TYPES).map(v => (
              <option key={v} value={v}>{t(`typeLabels.${v}`)}</option>
            ))}
          </Select>
          <Input name="title" required placeholder={t('needs.placeholderTitle')} variant="elevated" />
          <Textarea name="description" placeholder={t('needs.placeholderDescription')} rows={2} variant="elevated" className="sm:col-span-2" />
          <Input name="targetQuantity" type="number" min="1" placeholder={t('needs.placeholderQuantity')} variant="elevated" />
          <Input name="targetUnit" placeholder={t('needs.placeholderUnit')} variant="elevated" />
          <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className={cn(designPrimitive.buttonBase, designPrimitive.buttonSize.sm, designPrimitive.button.ghost, 'min-h-[40px]')}
            >
              {t('needs.addCancel')}
            </button>
            <button
              type="submit"
              className={cn(designPrimitive.buttonBase, designPrimitive.buttonSize.sm, designPrimitive.button.primary, 'min-h-[40px]')}
            >
              {t('needs.addSubmit')}
            </button>
          </div>
        </form>
      )}

      {needs.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-6">{t('needs.empty')}</p>
      ) : (
        <div className="space-y-3">
          {needs.map(need => (
            <div
              key={need.id}
              className="rounded-lg border border p-3 space-y-2"
            >
              {/* Row 1 — main editable line. Stacks on mobile, lays out responsively on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <Select
                  value={need.type}
                  onChange={e => patch(need.id, { type: e.target.value })}
                  className="text-xs sm:col-span-3 lg:col-span-2"
                  aria-label={t('needs.fieldType')}
                >
                  {Object.values(NEED_TYPES).map(v => (
                    <option key={v} value={v}>{t(`typeLabels.${v}`)}</option>
                  ))}
                </Select>

                <Input
                  value={need.title}
                  onChange={e => patch(need.id, { title: e.target.value })}
                  className="text-sm sm:col-span-9 lg:col-span-4"
                  aria-label={t('needs.fieldTitle')}
                />

                <Input
                  value={need.targetQuantity ?? ''}
                  onChange={e => patch(need.id, { targetQuantity: e.target.value ? Number(e.target.value) : null })}
                  type="number"
                  placeholder={t('needs.placeholderQuantityShort')}
                  className="text-xs sm:col-span-3 lg:col-span-1"
                />

                <Input
                  value={need.targetUnit ?? ''}
                  onChange={e => patch(need.id, { targetUnit: e.target.value })}
                  placeholder={t('needs.placeholderUnitShort')}
                  className="text-xs sm:col-span-3 lg:col-span-2"
                />

                <Select
                  value={need.status}
                  onChange={e => patch(need.id, { status: e.target.value })}
                  className="text-xs sm:col-span-4 lg:col-span-2"
                  aria-label={t('needs.fieldStatus')}
                >
                  {Object.values(NEED_STATUSES).map(v => (
                    <option key={v} value={v}>{t(`needStatusLabels.${v}`)}</option>
                  ))}
                </Select>

                <div className="sm:col-span-2 lg:col-span-1 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => save(need)}
                    disabled={pending}
                    className={cn(designPrimitive.buttonBase, designPrimitive.buttonSize.icon, designPrimitive.button.ghost)}
                    title={t('needs.tooltipSave')}
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(need.id)}
                    disabled={pending}
                    className={cn(designPrimitive.buttonBase, designPrimitive.buttonSize.icon, designPrimitive.button['destructive-ghost'])}
                    title={t('needs.tooltipDelete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Textarea
                value={need.description ?? ''}
                onChange={e => patch(need.id, { description: e.target.value })}
                rows={2}
                placeholder={t('needs.placeholderDescription')}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
