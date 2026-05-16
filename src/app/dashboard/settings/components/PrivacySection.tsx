'use client'

import { useState } from 'react'
import Heading from '@/components/ui/Heading'
import { Globe, Lock, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import { SETTINGS_CONFIG } from '@/config/profile'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../../profile/hooks/useProfileData'

interface PrivacySectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean) => void
}

export function PrivacySection({ profile, handleChange }: PrivacySectionProps) {
  const labels = SETTINGS_CONFIG.labels.privacy
  const t = useTranslations('dashboard.settings.privacy')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportData = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const response = await fetch('/api/user/export-data')
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || t('exportFailed'))
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const disposition = response.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      link.download = match?.[1] || `revampit-data-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : t('exportFailedRetry'),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div>
        <Heading level={3} className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {labels.title}
        </Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {labels.description}
        </p>

        <div className="space-y-4">
          <div>
            <Heading level={4} className="text-base font-medium text-neutral-900 dark:text-white mb-3">
              {labels.profileVisibility}
            </Heading>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {labels.profileVisibilityDescription}
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleChange('profile_visibility', 'public')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  profile.profile_visibility === 'public'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">{labels.profilePublic}</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('profile_visibility', 'private')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  profile.profile_visibility === 'private'
                    ? 'border-neutral-500 bg-neutral-50 dark:bg-neutral-900/20 text-neutral-700 dark:text-neutral-300'
                    : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500'
                }`}
              >
                <Lock className="w-5 h-5" />
                <span className="font-medium">{labels.profilePrivate}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Visibility */}
      <div className="border-t-2 border-neutral-200 dark:border-neutral-700 pt-6">
        <Heading level={4} className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
          {labels.contactVisibility}
        </Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {labels.contactVisibilityDescription}
        </p>

        <div className="space-y-4">
          {/* Show Email */}
          <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border-2 border-neutral-200 dark:border-neutral-600">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                {profile.show_email ? (
                  <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-neutral-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-neutral-900 dark:text-white">
                  {labels.showEmail}
                </h5>
                <button
                  type="button"
                  onClick={() => handleChange('show_email', !profile.show_email)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    profile.show_email ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      profile.show_email ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {labels.showEmailDescription}
              </p>
            </div>
          </div>

          {/* Show Phone */}
          <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border-2 border-neutral-200 dark:border-neutral-600">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                {profile.show_phone ? (
                  <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-neutral-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-neutral-900 dark:text-white">
                  {labels.showPhone}
                </h5>
                <button
                  type="button"
                  onClick={() => handleChange('show_phone', !profile.show_phone)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    profile.show_phone ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      profile.show_phone ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {labels.showPhoneDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export (GDPR / Swiss DSG) */}
      <div className="border-t-2 border-neutral-200 dark:border-neutral-700 pt-6">
        <Heading level={4} className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
          {t('dataExportTitle')}
        </Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {t('dataExportDescription')}
        </p>

        {exportError && (
          <div className="mb-4 rounded-lg border-2 border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
            <p className="text-sm text-error-700 dark:text-error-300">{exportError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleExportData}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-600 bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800 dark:text-primary-300 dark:hover:bg-primary-900/20"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('exportLoading')}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {t('downloadButton')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
