'use client'

import { Button } from '@/components/ui/button'
import {
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordChangeSectionProps {
  passwordData: PasswordChangeData
  isChangingPassword: boolean
  passwordSuccess: boolean
  passwordError: string | null
  handlePasswordChange: (e: React.FormEvent) => void
  handlePasswordFieldChange: (field: keyof PasswordChangeData, value: string) => void
}

export function PasswordChangeSection({
  passwordData,
  isChangingPassword,
  passwordSuccess,
  passwordError,
  handlePasswordChange,
  handlePasswordFieldChange,
}: PasswordChangeSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Passwort ändern
          </h2>
          <p className="text-sm text-gray-500">Halten Sie Ihr Konto sicher</p>
        </div>
      </div>

      {/* Password Change Success */}
      {passwordSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 dark:text-green-300">Passwort erfolgreich geändert!</p>
        </div>
      )}

      {/* Password Change Error */}
      {passwordError && (
        <div id="password-change-error" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{passwordError}</p>
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Aktuelles Passwort
          </label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Ihr aktuelles Passwort"
            required
            aria-required="true"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-change-error' : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Neues Passwort
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Mindestens 8 Zeichen"
              required
              aria-required="true"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-change-error' : undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Passwort wiederholen"
              required
              aria-required="true"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-change-error' : undefined}
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <p className="font-medium">Passwort-Anforderung:</p>
            <p className="mt-1">Mindestens 8 Zeichen</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isChangingPassword}
            variant="destructive"
            className="gap-2"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ändere...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Passwort ändern
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
