'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mail, ArrowRight, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getButtonVariant } from '@/lib/design-system'

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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          E-Mail verifiziert!
        </h2>
        <p className="text-gray-600 mb-6">
          dein Konto ist jetzt vollständig aktiviert.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Bestätige deine E-Mail
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Wir haben einen 6-stelligen Code an{' '}
          <span className="font-medium text-gray-900 dark:text-white">{email}</span>{' '}
          gesendet
        </p>
      </div>

      {/* Email send failure warning */}
      {emailSendFailed && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            Der Bestätigungscode konnte nicht gesendet werden.
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Bitte klicke unten auf «Code erneut senden».
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
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
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              digit ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
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
            <span>Wird überprüft...</span>
          </>
        ) : (
          <>
            <span>Verifizieren</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Keinen Code erhalten?
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {resendCooldown > 0 ? (
            <span>Erneut senden in {resendCooldown}s</span>
          ) : (
            <span>Code erneut senden</span>
          )}
        </button>
      </div>

      {/* Skip Option */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Später verifizieren
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          du kannst sich anmelden, aber einige Funktionen sind eingeschränkt
        </p>
      </div>
    </div>
  )
}
