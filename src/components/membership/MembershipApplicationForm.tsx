'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { CheckCircle, Loader2, AlertCircle, Copy, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { BANK, MEMBERSHIP, ORG } from '@/config/org'
import { UI_FEEDBACK_MS } from '@/config/limits'

function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value.replace(/\s/g, ''))
        setCopied(true)
        setTimeout(() => setCopied(false), UI_FEEDBACK_MS.COPY)
      }}
      className="inline-flex items-center gap-1 text-xs text-action hover:text-action font-medium"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? copiedLabel : label}
    </button>
  )
}

export function MembershipApplicationForm() {
  const { data: session } = useSession()
  const t = useTranslations('membership.form')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [memberType, setMemberType] = useState<'regular' | 'reduced'>('regular')
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    applicantName: session?.user?.name || '',
    applicantEmail: session?.user?.email || '',
    addressStreet: '',
    addressPostalCode: '',
    addressCity: '',
  })

  const canSubmit =
    !submitting &&
    formData.applicantName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(formData.applicantEmail) &&
    formData.addressStreet.trim().length >= 2 &&
    /^\d{4}$/.test(formData.addressPostalCode) &&
    formData.addressCity.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    const { data, error: apiError } = await apiFetch<{ id: string; memberType: string }>(
      '/api/membership/apply',
      { method: 'POST', body: { ...formData, memberType } }
    )

    setSubmitting(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data?.id) setSuccess(true)
  }

  const fee = memberType === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
  const paymentRef = `${MEMBERSHIP.referencePrefix}-${formData.applicantName.split(' ')[0].toUpperCase()}`

  if (success) {
    return (
      <div className="space-y-6">
        {/* Confirmation */}
        <div className="bg-action-muted border border-strong rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-action-muted rounded-full mb-4">
            <CheckCircle className="w-7 h-7 text-action" />
          </div>
          <Heading level={3} className="text-xl text-action mb-2">
            {t('welcome')}
          </Heading>
          <p className="text-action">
            {t('welcomeDesc', { orgName: ORG.name })}
          </p>
        </div>

        {/* Payment instructions */}
        <div className="bg-surface-base border border-strong rounded-xl p-6">
          <Heading level={3} className="text-lg text-text-primary mb-4">
            {t('paymentHeading')}
          </Heading>
          <p className="text-sm text-text-secondary mb-4">
            {t('paymentDesc', { currency: MEMBERSHIP.currency, fee })}
          </p>
          <div className="bg-surface-raised rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-text-tertiary">{t('recipientLabel')}</span>
                <p className="font-medium text-text-primary">{BANK.accountHolder}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-text-tertiary">{t('ibanLabel')}</span>
                <p className="font-mono font-medium text-text-primary">{BANK.iban}</p>
              </div>
              <CopyButton value={BANK.iban} label={t('copy')} copiedLabel={t('copied')} />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-text-tertiary">{t('bankLabel')}</span>
                <p className="text-text-primary">{BANK.name}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-text-tertiary">{t('purposeLabel')}</span>
                <p className="font-medium text-text-primary">{paymentRef}</p>
              </div>
              <CopyButton value={paymentRef} label={t('copy')} copiedLabel={t('copied')} />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-text-tertiary">{t('amountLabel')}</span>
                <p className="font-bold text-action">{MEMBERSHIP.currency} {fee}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            {t('twintNote', { suffix: session?.user?.email ? t('twintNoteEmail') : t('twintNoteNoEmail') })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 text-error-700 dark:text-error-400 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Membership type */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMemberType('regular')}
          className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
            memberType === 'regular' ? 'border-action bg-action-muted' : 'border-strong hover:border-strong'
          }`}
        >
          <div className="font-semibold text-text-primary">{t('regularLabel')}</div>
          <div className="text-sm text-text-secondary">CHF {MEMBERSHIP.fees.regular} / Jahr</div>
        </button>
        <button
          type="button"
          onClick={() => setMemberType('reduced')}
          className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
            memberType === 'reduced' ? 'border-action bg-action-muted' : 'border-strong hover:border-strong'
          }`}
        >
          <div className="font-semibold text-text-primary">{t('reducedLabel')}</div>
          <div className="text-sm text-text-secondary">CHF {MEMBERSHIP.fees.reduced} / Jahr</div>
          <div className="text-xs text-text-tertiary mt-0.5">{t('reducedSubLabel')}</div>
        </button>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">{t('nameLabel')} *</label>
          <input
            id="name"
            type="text"
            required
            value={formData.applicantName}
            onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-action focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">{t('emailLabel')} *</label>
          <input
            id="email"
            type="email"
            required
            value={formData.applicantEmail}
            onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-action focus:border-transparent"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-text-secondary mb-1">{t('streetLabel')} *</label>
        <input
          id="street"
          type="text"
          required
          value={formData.addressStreet}
          onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
          className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-action focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="plz" className="block text-sm font-medium text-text-secondary mb-1">{t('plzLabel')} *</label>
          <input
            id="plz"
            type="text"
            inputMode="numeric"
            maxLength={4}
            required
            value={formData.addressPostalCode}
            onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-action focus:border-transparent"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-text-secondary mb-1">{t('cityLabel')} *</label>
          <input
            id="city"
            type="text"
            required
            value={formData.addressCity}
            onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-action focus:border-transparent"
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!canSubmit}
        variant="primary"
        className="w-full sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('submitting')}
          </>
        ) : (
          t('submitButton', { currency: MEMBERSHIP.currency, fee })
        )}
      </Button>
      <p className="text-xs text-text-tertiary">
        {t('legalNote')}
      </p>
    </form>
  )
}
