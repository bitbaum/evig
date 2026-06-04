'use client'

/**
 * NeedContributionDialog — modal form for "I can help" with a specific need.
 * Posts to /api/projects/[slug]/contributions.
 *
 * Accepts the same flat `labels` shape as ProjectNeedsSection so callers
 * can pass through the i18n needs block unchanged.
 */

import { useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'
import type { NeedsSectionLabels } from './ProjectNeedsSection'

interface Need {
  id: string
  title: string
}

interface Props {
  slug: string
  need: Need
  typeLabel: string
  labels: NeedsSectionLabels
  onClose: () => void
}

export function NeedContributionDialog({ slug, need, typeLabel, labels, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      phone: String(form.get('phone') || '').trim() || undefined,
      organization: String(form.get('organization') || '').trim() || undefined,
      message: String(form.get('message') || '').trim(),
      needId: need.id,
    }

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(slug)}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)

      if (res.status === 429) {
        setError(labels.errorTooMany)
      } else if (!res.ok || !json?.success) {
        setError(labels.errorGeneric)
      } else {
        setDone(true)
      }
    } catch {
      setError(labels.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={labels.dialogTitle} size="lg">
      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary-500 mb-3" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {labels.successTitle}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {labels.successBody}
          </p>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              designPrimitive.buttonBase,
              designPrimitive.buttonSize.default,
              designPrimitive.button.primary,
              'min-h-[44px]',
            )}
          >
            {labels.cancel}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-surface-raised dark:bg-white/[0.03] p-3 text-sm">
            <p className="font-medium text-text-primary break-words">{need.title}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{typeLabel}</p>
          </div>

          <p className="text-sm text-text-secondary">{labels.dialogIntro}</p>

          <FormField label={labels.fields.name} required htmlFor="name">
            <Input id="name" name="name" required minLength={2} maxLength={200} variant="elevated" />
          </FormField>

          <FormField label={labels.fields.email} required htmlFor="email">
            <Input id="email" name="email" type="email" required maxLength={200} variant="elevated" />
          </FormField>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <FormField label={labels.fields.phone} htmlFor="phone">
              <Input id="phone" name="phone" maxLength={50} variant="elevated" />
            </FormField>
            <FormField label={labels.fields.organization} htmlFor="organization">
              <Input id="organization" name="organization" maxLength={200} variant="elevated" />
            </FormField>
          </div>

          <FormField label={labels.fields.message} required htmlFor="message">
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              maxLength={4000}
              rows={5}
              placeholder={labels.messagePlaceholder}
              variant="elevated"
            />
          </FormField>

          {error && (
            <p className="text-sm text-error-600 dark:text-error-400" role="alert">{error}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                designPrimitive.buttonBase,
                designPrimitive.buttonSize.default,
                designPrimitive.button.ghost,
                'min-h-[44px]',
              )}
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                designPrimitive.buttonBase,
                designPrimitive.buttonSize.default,
                designPrimitive.button.primary,
                'min-h-[44px]',
              )}
            >
              {submitting ? labels.submitting : labels.submit}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
