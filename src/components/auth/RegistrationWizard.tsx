'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Stepper } from '@/components/ui/Stepper'
import { AccountStep, VerifyStep } from './steps'
import {
  CheckCircle2,
  ArrowRight,
  Wrench,
  ShoppingBag,
  Search,
} from 'lucide-react'
import { useRegistration } from '@/hooks/useRegistration'

interface RegistrationState {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  userId?: string
  emailVerified: boolean
}

const STEPS = [
  { label: 'Konto', description: 'Erstellen Sie Ihr Konto' },
  { label: 'Verifizierung', description: 'Bestätigen Sie Ihre E-Mail' },
]

const STORAGE_KEY = 'revampit_registration_state'

export function RegistrationWizard() {
  const { isLoading, errors, verifyError, register, verifyCode, resendCode } = useRegistration()
  const [isComplete, setIsComplete] = useState(false)

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
    })

    if (result) {
      saveState({ userId: result.userId })
      setCurrentStep(1)
    }
  }

  // Step 2: Email Verification
  const handleVerify = async (code: string): Promise<boolean> => {
    const success = await verifyCode(state.email, code)

    if (success) {
      saveState({ emailVerified: true })
      clearState()
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Willkommen bei RevampIT!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {state.emailVerified
                ? 'Ihr Konto ist vollständig eingerichtet.'
                : 'Ihr Konto wurde erstellt. Vergessen Sie nicht, Ihre E-Mail zu verifizieren.'}
            </p>
          </div>

          {/* What do you want to do? */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Was möchten Sie als Nächstes tun?
            </p>

            <Link
              href="/it-hilfe"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  IT-Hilfe suchen
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Hilfe bei IT-Problemen finden
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </Link>

            <Link
              href="/profil/skills"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  IT-Hilfe anbieten
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Deine Skills erfassen und anderen helfen
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </Link>

            <Link
              href="/shop"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Shop durchstöbern
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Refurbished IT-Geräte entdecken
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
            >
              Jetzt anmelden
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={STEPS}
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
          />
        )}

        {/* Login Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bereits registriert?{' '}
            <Link
              href="/auth/login"
              className="text-green-600 hover:underline font-medium"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
