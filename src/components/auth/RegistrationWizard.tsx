'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Stepper } from '@/components/ui/Stepper'
import { Button } from '@/components/ui/button'
import { AccountStep, VerifyStep } from './steps'
import {
  CheckCircle2,
  ArrowRight,
  Wrench,
  ShoppingBag,
  Search,
} from 'lucide-react'
import { useRegistration } from '@/hooks/useRegistration'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
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

const STORAGE_KEY = 'revampit_registration_state'

export function RegistrationWizard() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const { isLoading, errors, verifyError, register, verifyCode, resendCode } = useRegistration()
  const [isComplete, setIsComplete] = useState(false)
  // Read ?ref=… once via lazy initializer — no useEffect-setState dance.
  // Guarded for SSR (Next pre-renders client components on the server too,
  // where window is undefined). The referral code is only used for
  // invite-link attribution, so capturing it on mount is sufficient.
  const [referralCode] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('ref') ?? undefined
  })
  const [emailSendFailed, setEmailSendFailed] = useState(false)

  const steps = [
    { label: t('stepAccountLabel'), description: t('stepAccountDesc') },
    { label: t('stepVerifyLabel'), description: t('stepVerifyDesc') },
  ]

  // Restore saved state from localStorage (lazy initializer avoids effect)
  const savedData = useState(() => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      return JSON.parse(saved) as { name?: string; email?: string; userId?: string; emailVerified?: boolean }
    } catch {
      // localStorage can fail in privacy-restricted browser contexts
      // or when stored JSON is malformed. Never crash the registration flow.
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore localStorage cleanup failures
      }
      return null
    }
  })[0]

  const [currentStep, setCurrentStep] = useState(() => {
    if (savedData?.userId && !savedData?.emailVerified) return 1
    return 0
  })

  const [state, setState] = useState<RegistrationState>(() => ({
    name: savedData?.name || '',
    email: savedData?.email || '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    userId: savedData?.userId,
    emailVerified: savedData?.emailVerified || false,
  }))

  // Save state to localStorage
  const saveState = (newState: Partial<RegistrationState>) => {
    const updated = { ...state, ...newState }
    setState(updated)

    // Don't save passwords
    const toSave = {
      name: updated.name,
      email: updated.email,
      userId: updated.userId,
      emailVerified: updated.emailVerified,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // localStorage persistence is best-effort; registration must not crash if it fails
    }
  }

  // Clear saved state
  const clearState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore localStorage cleanup failures
    }
  }

  // Step 1: Account Creation
  const handleAccountNext = async () => {
    const result = await register({
      email: state.email,
      password: state.password,
      name: state.name,
      referralCode,
    })

    if (result) {
      saveState({ userId: result.userId })
      setCurrentStep(1)
      if (result.emailSent === false) {
        // Email failed — user needs to know so they can resend
        setEmailSendFailed(true)
      }
    }
  }

  // Step 2: Email Verification
  const handleVerify = async (code: string): Promise<boolean> => {
    const success = await verifyCode(state.email, code)

    if (success) {
      saveState({ emailVerified: true })
      clearState()

      // Auto sign-in after email verification when password is still in memory.
      // Falls back to the completion screen (manual "Sign In Now") if password
      // is no longer available (e.g., user returned to the wizard after a page reload).
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
          // sign-in failed — fall through to completion screen
        }
      }

      setIsComplete(true)
    }

    return success
  }

  const handleResendCode = async (): Promise<boolean> => {
    return resendCode(state.email)
  }

  const handleSkipVerification = () => {
    clearState()
    setIsComplete(true)
  }

  // Navigate to completed step
  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  // Completion screen with options
  if (isComplete) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="card-shell rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary-600" />
            </div>
            <Heading level={2} className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              {t('welcomeHeading', { orgName: ORG.name })}
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400">
              {state.emailVerified
                ? t('accountReady')
                : t('accountCreatedVerifyPending')}
            </p>
          </div>

          {/* What do you want to do? */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              {t('nextStepsTitle')}
            </p>

            <Link
              href={ROUTES.public.itHilfe}
              className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white">
                  {t('findHelp')}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('findHelpDesc')}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-500" />
            </Link>

            <Link
              href={ROUTES.public.profilTechniker}
              className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white">
                  {t('offerHelp')}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('offerHelpDesc')}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-500" />
            </Link>

            <Link
              href={ROUTES.public.shop}
              className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white">
                  {t('browseShop')}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('browseShopDesc')}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-500" />
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <Button as={Link} href={ROUTES.public.login} variant="primary" className="w-full">
              {t('signInNow')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card-shell rounded-2xl p-6 sm:p-8">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Content */}
        {currentStep === 0 && (
          <AccountStep
            name={state.name}
            email={state.email}
            password={state.password}
            confirmPassword={state.confirmPassword}
            acceptTerms={state.acceptTerms}
            onNameChange={(name) => setState((prev) => ({ ...prev, name }))}
            onEmailChange={(email) => setState((prev) => ({ ...prev, email }))}
            onPasswordChange={(password) =>
              setState((prev) => ({ ...prev, password }))
            }
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
            error={verifyError}
            emailSendFailed={emailSendFailed}
          />
        )}

        {/* Login Link */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('alreadyRegistered')}{' '}
            <Link
              href={ROUTES.public.login}
              className="text-primary-600 hover:underline font-medium"
            >
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
