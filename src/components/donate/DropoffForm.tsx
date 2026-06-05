'use client'

/**
 * DropoffForm — public form on /get-involved/donate that lets a donor
 * announce a device drop-off intent. Posts to /api/donations/dropoff
 * (rate-limited, emails-only on the backend) and shows an inline
 * success state on the same surface so the user doesn't bounce.
 *
 * Form shape mirrors the DonationDropoffSchema fields directly — keep
 * the two in sync if the schema's required/optional set changes.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function DropoffForm() {
  const t = useTranslations('donate.dropoff')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [devices, setDevices] = useState('')
  const [notes, setNotes] = useState('')

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const payload: Record<string, string> = { name, email, devices }
    if (phone) payload.phone = phone
    if (preferredDate) payload.preferredDate = preferredDate
    if (notes) payload.notes = notes

    try {
      const { error: apiError } = await apiFetch('/api/donations/dropoff', {
        method: 'POST',
        body: payload,
      })
      if (apiError) {
        setErrorMsg(apiError)
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch (err) {
      logger.warn('Donation dropoff submission failed', { error: err })
      setErrorMsg(t('errorGeneric'))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-action-muted border border-strong p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-action shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-action mb-1">
              {t('successTitle')}
            </p>
            <p className="text-sm text-action">
              {t('successBody')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const inputClass = 'border-default dark:border-white/10 dark:placeholder:text-text-tertiary'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-text-secondary mb-1">{t('nameLabel')}</span>
          <Input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={2}
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-text-secondary mb-1">{t('emailLabel')}</span>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-text-secondary mb-1">{t('phoneLabel')}</span>
          <Input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={30}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-text-secondary mb-1">{t('preferredDateLabel')}</span>
          <Input
            type="date"
            value={preferredDate}
            onChange={e => setPreferredDate(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-text-secondary mb-1">{t('devicesLabel')}</span>
        <Textarea
          value={devices}
          onChange={e => setDevices(e.target.value)}
          required
          minLength={10}
          maxLength={1000}
          rows={3}
          placeholder={t('devicesPlaceholder')}
          className="resize-y"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-text-secondary mb-1">{t('notesLabel')}</span>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder={t('notesPlaceholder')}
          className="resize-y"
        />
      </label>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        {status === 'error' ? (
          <p className="text-sm text-error-600 dark:text-error-400">{errorMsg}</p>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          disabled={status === 'loading'}
          variant="primary"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
