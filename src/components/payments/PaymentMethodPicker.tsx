'use client'

/**
 * PaymentMethodPicker — lets the customer choose a payment rail.
 *
 * Fetches the rails offerable right now (`/api/payments/providers`) and AUTO-HIDES
 * when fewer than two are available — so today, with only Payrexx live, it renders
 * nothing and the checkout is unchanged. The moment a second rail is configured it
 * appears automatically, no code change. `escrow` restricts to escrow-capable rails
 * (P2P marketplace needs holds).
 *
 * Uses native radio inputs (the <Button>/<Select> primitives don't model a radio
 * group) + semantic design tokens only.
 */

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { DEFAULT_PROVIDER_SLUG } from '@/config/payment-providers'

interface ProviderOption {
  slug: string
  label: string
  descriptionKey: string
  supportsEscrow: boolean
}

interface PaymentMethodPickerProps {
  value: string | undefined
  onChange: (slug: string) => void
  /** True for escrow flows (P2P marketplace) → hides capture-on-pay rails. */
  escrow?: boolean
  disabled?: boolean
}

export function PaymentMethodPicker({ value, onChange, escrow = false, disabled = false }: PaymentMethodPickerProps) {
  const t = useTranslations('payment')
  const [providers, setProviders] = useState<ProviderOption[]>([])

  useEffect(() => {
    let active = true
    apiFetch<{ providers: ProviderOption[] }>(`/api/payments/providers?escrow=${escrow ? '1' : '0'}`)
      .then((res) => {
        if (!active) return
        const list = res.data?.providers ?? []
        setProviders(list)
        // Default the selection to the first available rail (Payrexx first).
        if (list.length > 1 && !value) {
          const preferred = list.find((p) => p.slug === DEFAULT_PROVIDER_SLUG) ?? list[0]
          onChange(preferred.slug)
        }
      })
      .catch((err) => logger.error('Failed to load payment providers', { error: err }))
    return () => {
      active = false
    }
    // Refetch only when the escrow requirement changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrow])

  // Nothing to choose → render nothing (checkout unchanged).
  if (providers.length < 2) return null

  const selected = value ?? DEFAULT_PROVIDER_SLUG

  return (
    <fieldset className="mb-4" disabled={disabled}>
      <legend className="text-sm font-semibold text-text-primary mb-1">{t('method.title')}</legend>
      <p className="text-xs text-text-tertiary mb-3">{t('method.subtitle')}</p>
      <div className="space-y-2">
        {providers.map((p) => {
          const isActive = p.slug === selected
          return (
            <label
              key={p.slug}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                isActive ? 'border-action bg-action-muted' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="paymentProvider"
                value={p.slug}
                checked={isActive}
                onChange={() => onChange(p.slug)}
                className="mt-1 accent-action"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{p.label}</span>
                <span className="text-xs text-text-secondary">{t(`method.${p.slug}` as never)}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default PaymentMethodPicker
