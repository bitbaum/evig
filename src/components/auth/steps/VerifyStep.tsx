'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, ArrowRight, ArrowLeft, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RESEND_CODE_COOLDOWN_SECONDS, VERIFICATION_CODE_LENGTH } from '@/config/auth-ui'

export interface VerifyStepProps {
  email: string
  onVerify: (code: string) => Promise<boolean>
  onResend: () => Promise<boolean>
  onSkip: () => void
  /**
   * Optional "wrong email?" affordance. When provided, VerifyStep shows
   * a small "E-Mail ändern" button under the email line that returns
   * to the account step. Wizard owns the back-navigation; this component
   * just signals user intent.
   */
  onEditEmail?: () => void
  isLoading?: boolean
  error?: string
  emailSendFailed?: boolean
}

/**
 * Email verification step.
 *
 * Code input is ONE field with `autoComplete="one-time-code"` — iOS and
 * Android both surface SMS one-time codes via this attribute, but only
 * if it's a single input. The previous 6-separate-inputs pattern
 * disabled autofill and reinvented paste handling without benefit.
 *
 * Auto-submits when the user reaches the configured code length
 * (typed or pasted).
 */
export function VerifyStep({
  email,
  onVerify,
  onResend,
  onSkip,
  onEditEmail,
  isLoading = false,
  error,
  emailSendFailed = false,
}: VerifyStepProps) {
  const t = useTranslations('auth.verify')
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, VERIFICATION_CODE_LENGTH)
    setCode(digits)

    if (digits.length === VERIFICATION_CODE_LENGTH) {
      void handleVerify(digits)
    }
  }

  const handleVerify = async (fullCode: string) => {
    if (isVerifying || fullCode.length !== VERIFICATION_CODE_LENGTH) return

    setIsVerifying(true)
    const success = await onVerify(fullCode)
    if (success) {
      setVerified(true)
    } else {
      setCode('')
      inputRef.current?.focus()
    }
    setIsVerifying(false)
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    const success = await onResend()
    if (success) {
      setResendCooldown(RESEND_CODE_COOLDOWN_SECONDS)
    }
    setIsResending(false)
  }

  if (verified) {
    return (
      <div role="status" aria-live="polite" className="text-center py-8">
        <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-action" />
        </div>
        <Heading level={2} className="text-xl font-bold text-text-primary mb-2">
          {t('successHeading')}
        </Heading>
        <p className="text-text-secondary mb-6">
          {t('successDesc')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-action" />
        </div>
        <Heading level={2} className="text-xl font-bold text-text-primary mb-2">
          {t('heading')}
        </Heading>
        <p className="text-text-secondary dark:text-text-muted">
          {t('description', { email })}
        </p>
        {onEditEmail && (
          <Button
            type="button"
            onClick={onEditEmail}
            variant="ghost"
            size="sm"
            className="mt-1 inline-flex items-center gap-1 text-action hover:text-action"
          >
            <ArrowLeft className="w-3 h-3" />
            {t('editEmail')}
          </Button>
        )}
      </div>

      {emailSendFailed && (
        <div className="p-4 rounded-lg bg-warning-50 border border-warning-200" role="alert">
          <p className="text-sm text-warning-800 font-medium">
            {t('emailSendFailed')}
          </p>
          <p className="text-sm text-warning-700 mt-1">
            {t('emailSendFailedAction')}
          </p>
        </div>
      )}

      {error && (
        <div id="verify-error" className="p-4 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30" role="alert">
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Single input with autoComplete one-time-code lets iOS/Android
          autofill the SMS code. The visual segmentation comes from
          tracking + tabular-nums; no JS reinvention. */}
      <div>
        <label htmlFor="verification-code" className="sr-only">
          {t('codeLabel')}
        </label>
        <Input
          ref={inputRef}
          id="verification-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={VERIFICATION_CODE_LENGTH}
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isVerifying || isLoading}
          placeholder="••••••"
          aria-invalid={!!error}
          aria-describedby={error ? 'verify-error' : undefined}
          className={cn(
            'w-full text-center text-3xl font-bold tracking-[0.5em] py-4 tabular-nums',
            (isVerifying || isLoading) && 'opacity-50',
          )}
        />
      </div>

      <Button
        type="button"
        onClick={() => handleVerify(code)}
        disabled={code.length !== VERIFICATION_CODE_LENGTH || isVerifying || isLoading}
        variant="primary"
        size="lg"
        className="w-full gap-2 font-semibold"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('verifying')}</span>
          </>
        ) : (
          <>
            <span>{t('verify')}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-text-secondary dark:text-text-muted mb-2">
          {t('noCode')}
        </p>
        <Button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          variant="ghost"
          size="sm"
          className="inline-flex gap-2 text-action hover:text-action font-medium"
        >
          {isResending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {resendCooldown > 0 ? (
            <span>{t('resendCooldown', { seconds: resendCooldown })}</span>
          ) : (
            <span>{t('resend')}</span>
          )}
        </Button>
      </div>

      <div className="pt-4 border-t border-strong">
        <Button
          type="button"
          onClick={onSkip}
          variant="ghost"
          size="sm"
          className="w-full text-center text-text-tertiary hover:text-text-secondary"
        >
          {t('skipVerify')}
        </Button>
        <p className="text-xs text-text-tertiary text-center mt-2">
          {t('skipDescription')}
        </p>
      </div>
    </div>
  )
}
