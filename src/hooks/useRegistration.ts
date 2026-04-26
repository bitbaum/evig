'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'

interface RegisterParams {
  email: string
  password: string
  name: string
}

interface RegisterResult {
  userId?: string
  emailSent?: boolean
}

interface UseRegistrationResult {
  isLoading: boolean
  errors: string[]
  verifyError: string | undefined
  register: (params: RegisterParams) => Promise<RegisterResult | null>
  verifyCode: (email: string, code: string) => Promise<boolean>
  resendCode: (email: string) => Promise<boolean>
}

export function useRegistration(): UseRegistrationResult {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [verifyError, setVerifyError] = useState<string | undefined>()

  const register = useCallback(async (params: RegisterParams): Promise<RegisterResult | null> => {
    setIsLoading(true)
    setErrors([])

    try {
      const result = await apiFetch<{ userId: string; emailSent: boolean }>('/api/auth/register', {
        method: 'POST',
        body: {
          email: params.email,
          password: params.password,
          name: params.name,
        },
      })

      if (!result.success || !result.data) {
        setErrors([result.error || 'Registrierung fehlgeschlagen'])
        return null
      }

      return { userId: result.data.userId, emailSent: result.data.emailSent }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyCode = useCallback(async (email: string, code: string): Promise<boolean> => {
    setVerifyError(undefined)

    const result = await apiFetch<unknown>('/api/auth/verify-code', {
      method: 'POST',
      body: { email, code },
    })

    if (!result.success) {
      setVerifyError(result.error || 'Ungültiger Code')
      return false
    }

    return true
  }, [])

  const resendCode = useCallback(async (email: string): Promise<boolean> => {
    const result = await apiFetch<unknown>('/api/auth/resend-code', {
      method: 'POST',
      body: { email },
    })

    return result.success
  }, [])

  return {
    isLoading,
    errors,
    verifyError,
    register,
    verifyCode,
    resendCode,
  }
}
