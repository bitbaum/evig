'use client'

/**
 * ProtocolConsent — Swiss legal: recording a meeting requires explicit
 * consent from every attendee (StGB Art. 179bis). Surface this once
 * before any audio is captured, persist the user's "I already asked
 * everyone" choice in localStorage so they don't have to re-tick on
 * every protocol they create.
 *
 * Implementation: single checkbox + optional "remember" sub-checkbox.
 * Parent controls gating logic (e.g. disable RecordButton when not
 * consented).
 */

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'protocol-consent-acknowledged'

interface Props {
  /** Current value. Parent owns the truth so the form can reset on submit. */
  value: boolean
  onChange: (next: boolean) => void
}

export function ProtocolConsent({ value, onChange }: Props) {
  const t = useTranslations('admin.protocols.consent')
  const [remember, setRemember] = useState(false)

  // Restore from localStorage on mount. Only auto-tick the visible
  // consent box if the user has previously asked to remember it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(STORAGE_KEY) === 'true') {
      setRemember(true)
      onChange(true)
    }
    // onChange intentionally not in deps — parent re-rendering must
    // not retrigger restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = (next: boolean) => {
    onChange(next)
    if (typeof window !== 'undefined') {
      if (next && remember) {
        window.localStorage.setItem(STORAGE_KEY, 'true')
      } else if (!next) {
        // Clear sticky state when user unchecks.
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  const handleRememberToggle = (next: boolean) => {
    setRemember(next)
    if (typeof window === 'undefined') return
    if (next && value) {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } else if (!next) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 rounded-sm border-default text-action focus:ring-action"
        />
        <span className="text-text-secondary">{t('label')}</span>
      </label>

      {value && (
        <label className="flex items-start gap-2 cursor-pointer text-xs text-text-tertiary ml-6">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => handleRememberToggle(e.target.checked)}
            className="mt-0.5 rounded-sm border-default text-action focus:ring-action"
          />
          <span>{t('remember')}</span>
        </label>
      )}
    </div>
  )
}
