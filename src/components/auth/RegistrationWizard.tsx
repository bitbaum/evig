'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Stepper } from '@/components/ui/Stepper'
import { AccountStep, VerifyStep } from './steps'
import { RegistrationCompletionScreen } from './RegistrationCompletionScreen'
import { useRegistration } from '@/hooks/useRegistration'
import { REGISTRATION_STORAGE_KEY } from '@/config/auth-ui'
import { ROUTES } from '@/config/routes'

interface RegistrationState {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  userId?: string
  emailVerified: boolean
}

type PersistedState = Pick<RegistrationState, 'name' | 'email' | 'userId' | 'emailVerified'>

/**
 * Read the persisted in-progress registration from localStorage.
 * Returns null if nothing's saved, or if the storage layer fails
 * (e.g. privacy-restricted browser context). Best-effort restore;
 * never throws.
 */
function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(REGISTRATION_STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved) as PersistedState
  } catch {
    try {
      localStorage.removeItem(REGISTRATION_STORAGE_KEY)
    } catch {
      // ignore secondary failure
    }
    return null
  }
}

/**
 * Save the persistable subset of registration state. Password is never
 * persisted — if the page reloads, the auto-signin step falls back to
 * the completion screen and the user signs in manually.
 */
function savePersistedState(state: RegistrationState): void {
  if (typeof window === 'undefined') return
  const toSave: PersistedState = {
    name: state.name,
    email: state.email,
    userId: state.userId,
    emailVerified: state.emailVerified,
  }
  try {
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // localStorage persistence is best-effort
  }
}

function clearPersistedState(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(REGISTRATION_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function RegistrationWizard() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const { isLoading, errors, verifyError, register, verifyCode, resendCode } = useRegistration()
  const [isComplete, setIsComplete] = useState(false)

  // Lazy initialiser captures ?ref=… once per mount. Falls back to undefined
  // when window is unavailable (SSR pre-render).
  const [referralCode] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('ref') ?? undefined
  })

  const [prefillEmail] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('email') ?? undefined
  })

  const [emailSendFailed, setEmailSendFailed] = useState(false)
  const savedData = useState(() => loadPersistedState())[0]

  const [currentStep, setCurrentStep] = useState(() => {
    if (savedData?.userId && !savedData?.emailVerified) return 1
    if (prefillEmail) return 1
    return 0
  })

  const [state, setState] = useState<RegistrationState>(() => ({
    name: savedData?.name || '',
    email: savedData?.email || prefillEmail || '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    userId: savedData?.userId,
    emailVerified: savedData?.emailVerified || false,
  }))

  const updateState = (patch: Partial<RegistrationState>) => {
    const updated = { ...state, ...patch }
    setState(updated)
    savePersistedState(updated)
  }

  const steps = [
    { label: t('stepAccountLabel'), description: t('stepAccountDesc') },
    { label: t('stepVerifyLabel'), description: t('stepVerifyDesc') },
  ]

  const prefillResentRef = useRef(false)
  useEffect(() => {
    if (!prefillEmail || prefillResentRef.current || currentStep !== 1) return
    prefillResentRef.current = true
    void resendCode(prefillEmail).then(sent => {
      if (!sent) setEmailSendFailed(true)
    })
  }, [prefillEmail, currentStep, resendCode])

  // Step 1: Account Creation
  const handleAccountNext = async () => {
    const result = await register({
      email: state.email,
      password: state.password,
      name: state.name,
      referralCode,
    })

    if (result) {
      updateState({ userId: result.userId })
      setCurrentStep(1)
      if (result.emailSent === false) {
        setEmailSendFailed(true)
      }
    }
  }

  // Step 2: Email Verification
  const handleVerify = async (code: string): Promise<boolean> => {
    const success = await verifyCode(state.email, code)
    if (!success) return false

    updateState({ emailVerified: true })
    clearPersistedState()

    // Auto sign-in when password is still in memory. If the page was
    // reloaded between steps, state.password is empty and we fall
    // through to the completion screen with a "Sign In Now" link.
    if (state.password) {
      try {
        const result = await signIn('credentials', {
          email: state.email,
          password: state.password,
          redirect: false,
        })
        if (result?.ok) {
          router.replace('/dashboard')
          return true
        }
      } catch {
        // fall through to completion
      }
    }

    setIsComplete(true)
    return true
  }

  const handleResendCode = (): Promise<boolean> => resendCode(state.email)

  const handleSkipVerification = () => {
    clearPersistedState()
    setIsComplete(true)
  }

  // User typed wrong email at step 0 — let them go back and fix it.
  // The userId from the failed attempt stays in localStorage; the next
  // register() call will fail-loud if the email collides, which is the
  // correct signal.
  const handleEditEmail = () => {
    setCurrentStep(0)
  }

  // Stepper back-navigation: only allow going to earlier steps.
  const handleStepClick = (step: number) => {
    if (step < currentStep) setCurrentStep(step)
  }

  if (isComplete) {
    return <RegistrationCompletionScreen emailVerified={state.emailVerified} />
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card-shell rounded-2xl p-6 sm:p-8">
        <div className="mb-8">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {currentStep === 0 && (
          <AccountStep
            name={state.name}
            email={state.email}
            password={state.password}
            confirmPassword={state.confirmPassword}
            acceptTerms={state.acceptTerms}
            onNameChange={(name) => setState((prev) => ({ ...prev, name }))}
            onEmailChange={(email) => setState((prev) => ({ ...prev, email }))}
            onPasswordChange={(password) => setState((prev) => ({ ...prev, password }))}
            onConfirmPasswordChange={(confirmPassword) =>
              setState((prev) => ({ ...prev, confirmPassword }))
            }
            onAcceptTermsChange={(acceptTerms) =>
              setState((prev) => ({ ...prev, acceptTerms }))
            }
            onNext={handleAccountNext}
            isLoading={isLoading}
            errors={errors}
          />
        )}

        {currentStep === 1 && (
          <VerifyStep
            email={state.email}
            onVerify={handleVerify}
            onResend={handleResendCode}
            onSkip={handleSkipVerification}
            onEditEmail={handleEditEmail}
            error={verifyError}
            emailSendFailed={emailSendFailed}
          />
        )}

        <div className="mt-8 pt-6 border-t border-strong text-center">
          <p className="text-sm text-text-secondary dark:text-text-muted">
            {t('alreadyRegistered')}{' '}
            <Link
              href={ROUTES.public.login}
              className="text-action hover:underline font-medium"
            >
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
