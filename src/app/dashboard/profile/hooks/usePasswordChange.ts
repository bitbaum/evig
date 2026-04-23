'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { UI_FEEDBACK_MS } from '@/config/limits'

export function usePasswordChange() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    logger.info('Password change starting')

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (!response.ok) {
        logger.error('Password change failed', {
          status: response.status,
          error: data.error,
        })
        throw new Error(data.error || 'Passwort-Änderung fehlgeschlagen')
      }

      logger.info('Password changed successfully')
      setPasswordSuccess(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      setTimeout(() => setPasswordSuccess(false), UI_FEEDBACK_MS.SUCCESS)
    } catch (error) {
      logger.error('Password change error', { error })
      setPasswordError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePasswordFieldChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  return {
    passwordData,
    isChangingPassword,
    passwordSuccess,
    passwordError,
    handlePasswordChange,
    handlePasswordFieldChange,
  }
}
