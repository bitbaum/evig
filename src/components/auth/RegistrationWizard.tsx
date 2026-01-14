'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Stepper } from '@/components/ui/Stepper'
import { RoleStep, AccountStep, VerifyStep, ProfileStep } from './steps'
import { ROLES } from '@/lib/constants'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface ProfileData {
  location?: string
  interests?: string[]
  businessName?: string
  services?: string[]
  categories?: string[]
}

interface RegistrationState {
  role: string
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  profileData: ProfileData
  userId?: string
  emailVerified: boolean
}

const STEPS = [
  { label: 'Rolle', description: 'Wählen Sie Ihre Rolle' },
  { label: 'Konto', description: 'Erstellen Sie Ihr Konto' },
  { label: 'Verifizierung', description: 'Bestätigen Sie Ihre E-Mail' },
  { label: 'Profil', description: 'Optional: Vervollständigen' }
]

const STORAGE_KEY = 'revampit_registration_state'

export function RegistrationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [verifyError, setVerifyError] = useState<string>()
  const [isComplete, setIsComplete] = useState(false)

  const [state, setState] = useState<RegistrationState>({
    role: ROLES.CUSTOMER,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    profileData: {},
    emailVerified: false
  })

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Don't restore password for security
        setState(prev => ({
          ...prev,
          role: parsed.role || ROLES.CUSTOMER,
          name: parsed.name || '',
          email: parsed.email || '',
          profileData: parsed.profileData || {},
          userId: parsed.userId,
          emailVerified: parsed.emailVerified || false
        }))
        // If user already created account, skip to verification
        if (parsed.userId && !parsed.emailVerified) {
          setCurrentStep(2)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save state to localStorage
  const saveState = (newState: Partial<RegistrationState>) => {
    const updated = { ...state, ...newState }
    setState(updated)
    // Don't save passwords
    const toSave = {
      role: updated.role,
      name: updated.name,
      email: updated.email,
      profileData: updated.profileData,
      userId: updated.userId,
      emailVerified: updated.emailVerified
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  }

  // Clear saved state
  const clearState = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Step 1: Role Selection
  const handleRoleNext = () => {
    setCurrentStep(1)
  }

  // Step 2: Account Creation
  const handleAccountNext = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
          name: state.name,
          role: state.role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(data.errors || [data.error || 'Registrierung fehlgeschlagen'])
        setIsLoading(false)
        return
      }

      // Save user ID and move to verification
      saveState({ userId: data.data?.userId })
      setCurrentStep(2)
    } catch {
      setErrors(['Ein Netzwerkfehler ist aufgetreten'])
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Email Verification
  const handleVerify = async (code: string): Promise<boolean> => {
    setVerifyError(undefined)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, code })
      })

      const data = await response.json()

      if (!response.ok) {
        setVerifyError(data.error || 'Ungültiger Code')
        return false
      }

      saveState({ emailVerified: true })
      setCurrentStep(3)
      return true
    } catch {
      setVerifyError('Ein Fehler ist aufgetreten')
      return false
    }
  }

  const handleResendCode = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      })

      return response.ok
    } catch {
      return false
    }
  }

  const handleSkipVerification = () => {
    setCurrentStep(3)
  }

  // Step 4: Profile Completion
  const handleProfileComplete = async () => {
    setIsLoading(true)

    try {
      // Save profile data if provided
      if (Object.keys(state.profileData).length > 0) {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.profileData)
        })
      }

      clearState()
      setIsComplete(true)
    } catch {
      // Profile save failed, but still allow completion
      clearState()
      setIsComplete(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipProfile = () => {
    clearState()
    setIsComplete(true)
  }

  // Navigate to completed step
  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Willkommen bei RevampIT!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {state.emailVerified
              ? 'Ihr Konto ist vollständig eingerichtet.'
              : 'Ihr Konto wurde erstellt. Vergessen Sie nicht, Ihre E-Mail zu verifizieren.'}
          </p>
          <div className="space-y-3">
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
          <RoleStep
            selectedRole={state.role}
            onRoleChange={(role) => saveState({ role })}
            onNext={handleRoleNext}
          />
        )}

        {currentStep === 1 && (
          <AccountStep
            name={state.name}
            email={state.email}
            password={state.password}
            confirmPassword={state.confirmPassword}
            acceptTerms={state.acceptTerms}
            onNameChange={(name) => setState(prev => ({ ...prev, name }))}
            onEmailChange={(email) => setState(prev => ({ ...prev, email }))}
            onPasswordChange={(password) => setState(prev => ({ ...prev, password }))}
            onConfirmPasswordChange={(confirmPassword) => setState(prev => ({ ...prev, confirmPassword }))}
            onAcceptTermsChange={(acceptTerms) => setState(prev => ({ ...prev, acceptTerms }))}
            onNext={handleAccountNext}
            onBack={() => setCurrentStep(0)}
            isLoading={isLoading}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <VerifyStep
            email={state.email}
            onVerify={handleVerify}
            onResend={handleResendCode}
            onSkip={handleSkipVerification}
            error={verifyError}
          />
        )}

        {currentStep === 3 && (
          <ProfileStep
            role={state.role}
            profileData={state.profileData}
            onProfileChange={(profileData) => saveState({ profileData })}
            onNext={handleProfileComplete}
            onSkip={handleSkipProfile}
            isLoading={isLoading}
          />
        )}

        {/* Login Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bereits registriert?{' '}
            <Link href="/auth/login" className="text-green-600 hover:underline font-medium">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
