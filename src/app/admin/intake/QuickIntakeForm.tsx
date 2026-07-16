'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  PackagePlus,
  Printer,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { KATEGORIEN, ZUSTAND_OPTIONS } from '@/config/erfassung'
import {
  getIntakeTierOptions,
  INTAKE_TIERS,
  type IntakeTier,
} from '@/config/intake-checklist'
import { ROUTES } from '@/config/routes'

export interface DonationPrefill {
  id: string | null
  name: string
  email: string
}

interface CreatedDevice {
  inventory_id: string
  item_uuid: string
}

interface QuickIntakeFormProps {
  donationPrefill?: DonationPrefill
  onCancel: () => void
  onCreated: (device: CreatedDevice) => void
}

/**
 * Keyboard-first workshop intake.
 *
 * The operational minimum is deliberately two fields: manufacturer → model
 * → Enter. Everything that can be decided later (category, donor, condition,
 * exact processing tier) lives behind one disclosure. The same POST endpoint
 * and schemas as the full intake form remain the data SSOT.
 */
export function QuickIntakeForm({ donationPrefill, onCancel, onCreated }: QuickIntakeFormProps) {
  const t = useTranslations('admin.intake.quickCapture')
  const brandRef = useRef<HTMLInputElement>(null)
  const hasDonationPrefill = Boolean(donationPrefill?.id || donationPrefill?.name || donationPrefill?.email)

  const [brand, setBrand] = useState('')
  const [productName, setProductName] = useState('')
  const [tier, setTier] = useState<IntakeTier>(INTAKE_TIERS.REFURBISH)
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('good')
  const [detailsOpen, setDetailsOpen] = useState(hasDonationPrefill)
  const [isDonation, setIsDonation] = useState(hasDonationPrefill)
  const [donorName, setDonorName] = useState(donationPrefill?.name ?? '')
  const [donorEmail, setDonorEmail] = useState(donationPrefill?.email ?? '')
  const [donorNotes, setDonorNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedDevice | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!brand.trim() || !productName.trim() || saving) return

    setSaving(true)
    setError(null)
    try {
      const result = await apiFetch<CreatedDevice>('/api/admin/intake', {
        method: 'POST',
        body: {
          hersteller: brand.trim(),
          produktname: productName.trim(),
          zustand: condition,
          hauptkategorie: category || undefined,
          intake_tier: tier,
          is_donation: isDonation,
          donor_name: isDonation ? donorName.trim() || undefined : undefined,
          donor_email: isDonation ? donorEmail.trim() || undefined : undefined,
          donor_notes: isDonation ? donorNotes.trim() || undefined : undefined,
          existing_donation_id: isDonation ? donationPrefill?.id || undefined : undefined,
        },
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || t('saveFailed'))
      }

      setCreated(result.data)
      setBrand('')
      setProductName('')
      onCreated(result.data)
      requestAnimationFrame(() => brandRef.current?.focus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{t('title')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('description')}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('close')}
        </Button>
      </div>

      {created && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-strong bg-action-muted p-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-action" aria-hidden="true" />
          <span className="font-medium text-text-primary">
            {t('created', { itemUuid: created.item_uuid })}
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <Link
              href={ROUTES.admin.intakeLabel(created.inventory_id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-default bg-surface-base px-3 py-2 font-medium text-text-primary hover:bg-surface-raised"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t('printLabel')}
            </Link>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onCancel()}
              className="min-h-11"
            >
              {t('openPipeline')}
            </Button>
          </span>
        </div>
      )}

      <form onSubmit={submit} className="rounded-xl border border-strong bg-surface-base p-4 sm:p-6">
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-300">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto] sm:items-end">
          <div>
            <label htmlFor="quick-intake-brand" className="mb-1.5 block text-sm font-medium text-text-secondary">
              {t('brand')}
            </label>
            <Input
              ref={brandRef}
              id="quick-intake-brand"
              autoFocus
              autoComplete="off"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder={t('brandPlaceholder')}
              required
              className="min-h-11"
            />
          </div>
          <div>
            <label htmlFor="quick-intake-product" className="mb-1.5 block text-sm font-medium text-text-secondary">
              {t('productName')}
            </label>
            <Input
              id="quick-intake-product"
              autoComplete="off"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder={t('productNamePlaceholder')}
              required
              className="min-h-11"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || !brand.trim() || !productName.trim()}
            className="min-h-11 gap-2 px-5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            {saving ? t('saving') : t('submit')}
          </Button>
        </div>
        <p className="mt-2 text-xs text-text-tertiary">{t('keyboardHint')}</p>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          className="mt-4 min-h-11 w-full justify-between border-t border-subtle px-0 pt-4 text-sm text-text-secondary hover:text-text-primary"
        >
          <span>{t('details')}</span>
          {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {detailsOpen && (
          <div className="mt-3 grid gap-4 border-t border-subtle pt-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quick-intake-tier" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('tier')}
              </label>
              <Select id="quick-intake-tier" value={tier} onChange={(event) => setTier(event.target.value as IntakeTier)}>
                {getIntakeTierOptions().map((option) => (
                  <option key={option.value} value={option.value}>{option.icon} {option.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="quick-intake-category" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('category')}
              </label>
              <Select id="quick-intake-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{t('categoryLater')}</option>
                {KATEGORIEN.map((item) => (
                  <option key={item.value} value={item.value}>{item.icon} {item.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="quick-intake-condition" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('condition')}
              </label>
              <Select id="quick-intake-condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
                {ZUSTAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end rounded-lg border border-subtle px-3 py-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={isDonation}
                onChange={(event) => setIsDonation(event.target.checked)}
                className="rounded border-strong text-action focus:ring-action"
              />
              {t('donation')}
            </label>

            {isDonation && (
              <>
                <div>
                  <label htmlFor="quick-intake-donor" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('donorName')}
                  </label>
                  <Input id="quick-intake-donor" value={donorName} onChange={(event) => setDonorName(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="quick-intake-email" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('donorEmail')}
                  </label>
                  <Input id="quick-intake-email" type="email" value={donorEmail} onChange={(event) => setDonorEmail(event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="quick-intake-notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('donorNotes')}
                  </label>
                  <Textarea id="quick-intake-notes" rows={2} value={donorNotes} onChange={(event) => setDonorNotes(event.target.value)} />
                </div>
              </>
            )}
          </div>
        )}
      </form>

      <Link
        href={`${ROUTES.admin.erfassung}?annahme=1`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-action hover:underline"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {t('fullCapture')}
      </Link>
    </div>
  )
}
