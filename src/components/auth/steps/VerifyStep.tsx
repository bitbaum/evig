'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, ArrowRight, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getButtonVariant } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

export interface VerifyStepProps {
  email: string
  onVerify: (code: string) => Promise<boolean>
  onResend: () => Promise<boolean>
  onSkip: () => void
  isLoading?: boolean
  error?: string
  emailSendFailed?: boolean
}

export function VerifyStep({
  email,
  onVerify,
  onResend,
  onSkip,
  isLoading = false,
  error,
  emailSendFailed = false,
}: VerifyStepProps) {
  const t = useTranslations('auth.verify')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (digit && index === 5 && newCode.every(d => d)) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (fullCode: string) => {
    if (isVerifying || fullCode.length !== 6) return

    setIsVerifying(true)
    const success = await onVerify(fullCode)
    if (success) {
      setVerified(true)
    } else {
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
    setIsVerifying(false)
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    const success = await onResend()
    if (success) {
      setResendCooldown(60)
    }
    setIsResending(false)
  }

  if (verified) {
    return (
      <div className="text-center py-8">
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
      </div>

      {/* Email send failure warning */}
      {emailSendFailed && (
        <div className="p-4 rounded-lg bg-warning-50 border border-warning-200">
          <p className="text-sm text-warning-800 font-medium">
            {t('emailSendFailed')}
          </p>
          <p className="text-sm text-warning-700 mt-1">
            {t('emailSendFailedAction')}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30">
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Code Input */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isVerifying || isLoading}
            className={cn(
              'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 transition-colors',
              'focus:ring-2 focus:ring-action focus:border-action',
              digit ? 'border-action bg-action-muted' : 'border-default',
              (isVerifying || isLoading) && 'opacity-50'
            )}
          />
        ))}
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={() => handleVerify(code.join(''))}
        disabled={code.some(d => !d) || isVerifying || isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          getButtonVariant('primary').bg,
          getButtonVariant('primary').text,
          getButtonVariant('primary').hover
        )}
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
      </button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-text-secondary dark:text-text-muted mb-2">
          {t('noCode')}
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="inline-flex items-center gap-2 text-action hover:text-action font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
        </button>
      </div>

      {/* Skip Option */}
      <div className="pt-4 border-t border-strong">
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center text-sm text-text-tertiary hover:text-text-secondary"
        >
          {t('skipVerify')}
        </button>
        <p className="text-xs text-text-tertiary text-center mt-2">
          {t('skipDescription')}
        </p>
      </div>
    </div>
  )
}
