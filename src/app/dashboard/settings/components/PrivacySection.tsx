'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-2">
          {labels.title}
        </Heading>
        <p className="text-sm text-text-secondary mb-6">
          {labels.description}
        </p>

        <div className="space-y-4">
          <div>
            <Heading level={4} className="text-base font-medium text-text-primary mb-3">
              {labels.profileVisibility}
            </Heading>
            <p className="text-sm text-text-secondary mb-4">
              {labels.profileVisibilityDescription}
            </p>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => handleChange('profile_visibility', 'public')}
                variant="ghost"
                className={`flex-1 rounded-lg border-2 py-3 ${
                  profile.profile_visibility === 'public'
                    ? 'border-action bg-action-muted text-action'
                    : 'border bg-surface-base text-text-secondary hover:border-strong'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">{labels.profilePublic}</span>
              </Button>

              <Button
                type="button"
                onClick={() => handleChange('profile_visibility', 'private')}
                variant="ghost"
                className={`flex-1 rounded-lg border-2 py-3 ${
                  profile.profile_visibility === 'private'
                    ? 'border-strong bg-surface-raised text-text-secondary'
                    : 'border bg-surface-base text-text-secondary hover:border-strong'
                }`}
              >
                <Lock className="w-5 h-5" />
                <span className="font-medium">{labels.profilePrivate}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Visibility */}
      <div className="border-t-2 border pt-6">
        <Heading level={4} className="text-base font-semibold text-text-primary mb-2">
          {labels.contactVisibility}
        </Heading>
        <p className="text-sm text-text-secondary mb-6">
          {labels.contactVisibilityDescription}
        </p>

        <div className="space-y-4">
          {/* Show Email */}
          <div className="flex items-start gap-4 p-4 bg-surface-raised rounded-lg border-2 border">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
                {profile.show_email ? (
                  <Eye className="w-5 h-5 text-action" />
                ) : (
                  <EyeOff className="w-5 h-5 text-text-muted" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-text-primary">
                  {labels.showEmail}
                </h5>
                <Button
                  type="button"
                  onClick={() => handleChange('show_email', !profile.show_email)}
                  variant="ghost"
                  role="switch"
                  aria-checked={profile.show_email}
                  className={`relative h-6 w-11 min-h-0 min-w-0 shrink-0 cursor-pointer rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out hover:bg-transparent ${
                    profile.show_email ? 'bg-action' : 'bg-surface-overlay'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-base shadow ring-0 transition duration-200 ease-in-out ${
                      profile.show_email ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </Button>
              </div>
              <p className="text-sm text-text-secondary">
                {labels.showEmailDescription}
              </p>
            </div>
          </div>

          {/* Show Phone */}
          <div className="flex items-start gap-4 p-4 bg-surface-raised rounded-lg border-2 border">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
                {profile.show_phone ? (
                  <Eye className="w-5 h-5 text-action" />
                ) : (
                  <EyeOff className="w-5 h-5 text-text-muted" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-text-primary">
                  {labels.showPhone}
                </h5>
                <Button
                  type="button"
                  onClick={() => handleChange('show_phone', !profile.show_phone)}
                  variant="ghost"
                  role="switch"
                  aria-checked={profile.show_phone}
                  className={`relative h-6 w-11 min-h-0 min-w-0 shrink-0 cursor-pointer rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out hover:bg-transparent ${
                    profile.show_phone ? 'bg-action' : 'bg-surface-overlay'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-base shadow ring-0 transition duration-200 ease-in-out ${
                      profile.show_phone ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </Button>
              </div>
              <p className="text-sm text-text-secondary">
                {labels.showPhoneDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export (GDPR / Swiss DSG) */}
      <div className="border-t-2 border pt-6">
        <Heading level={4} className="text-base font-semibold text-text-primary mb-2">
          {t('dataExportTitle')}
        </Heading>
        <p className="text-sm text-text-secondary mb-4">
          {t('dataExportDescription')}
        </p>

        {exportError && (
          <div className="mb-4 rounded-lg border-2 border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
            <p className="text-sm text-error-700 dark:text-error-300">{exportError}</p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleExportData}
          disabled={isExporting}
          variant="outline"
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
        </Button>
      </div>
    </div>
  )
}
