'use client'

import { useState, useCallback } from 'react'

interface RegisterParams {
  email: string
  password: string
  name: string
}

interface RegisterResult {
  userId?: string
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          name: params.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(data.errors || [data.error || 'Registrierung fehlgeschlagen'])
        return null
      }

      return { userId: data.data?.userId }
    } catch {
      setErrors(['Ein Netzwerkfehler ist aufgetreten'])
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyCode = useCallback(async (email: string, code: string): Promise<boolean> => {
    setVerifyError(undefined)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setVerifyError(data.error || 'Ungültiger Code')
        return false
      }

      return true
    } catch {
      setVerifyError('Ein Fehler ist aufgetreten')
      return false
    }
  }, [])

  const resendCode = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      return response.ok
    } catch {
      return false
    }
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
