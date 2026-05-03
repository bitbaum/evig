'use client'

import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('dashboard.profile.password')
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-error-100 dark:bg-error-900/30 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-error-600" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('heading')}
          </Heading>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* Password Change Success */}
      {passwordSuccess && (
        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary-600" />
          <p className="text-primary-700 dark:text-primary-300">{t('success')}</p>
        </div>
      )}

      {/* Password Change Error */}
      {passwordError && (
        <div id="password-change-error" className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <p className="text-error-700 dark:text-error-300">{passwordError}</p>
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('currentLabel')}
          </label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('currentPlaceholder')}
            required
            aria-required="true"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-change-error' : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('newLabel')}
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('newPlaceholder')}
              required
              aria-required="true"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-change-error' : undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('confirmLabel')}
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('confirmPlaceholder')}
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
            <p className="font-medium">{t('requirementTitle')}</p>
            <p className="mt-1">{t('requirementText')}</p>
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
                {t('changing')}
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                {t('submitButton')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
