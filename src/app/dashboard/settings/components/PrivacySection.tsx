'use client'

import { useState } from 'react'
import Heading from '@/components/ui/Heading'
import { Globe, Lock, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import { SETTINGS_CONFIG } from '@/config/profile'
import type { ProfileData } from '../../profile/hooks/useProfileData'

interface PrivacySectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean) => void
}

export function PrivacySection({ profile, handleChange }: PrivacySectionProps) {
  const labels = SETTINGS_CONFIG.labels.privacy
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportData = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const response = await fetch('/api/user/export-data')
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Export fehlgeschlagen')
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
        error instanceof Error ? error.message : 'Export fehlgeschlagen. Bitte versuche es später erneut.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div>
        <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {labels.title}
        </Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {labels.description}
        </p>

        <div className="space-y-4">
          <div>
            <Heading level={4} className="text-base font-medium text-gray-900 dark:text-white mb-3">
              {labels.profileVisibility}
            </Heading>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {labels.profileVisibilityDescription}
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleChange('profile_visibility', 'public')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  profile.profile_visibility === 'public'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
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
                    ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
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
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
        <Heading level={4} className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {labels.contactVisibility}
        </Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {labels.contactVisibilityDescription}
        </p>

        <div className="space-y-4">
          {/* Show Email */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border-2 border-gray-200 dark:border-neutral-600">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                {profile.show_email ? (
                  <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  {labels.showEmail}
                </h5>
                <button
                  type="button"
                  onClick={() => handleChange('show_email', !profile.show_email)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    profile.show_email ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      profile.show_email ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {labels.showEmailDescription}
              </p>
            </div>
          </div>

          {/* Show Phone */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border-2 border-gray-200 dark:border-neutral-600">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                {profile.show_phone ? (
                  <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  {labels.showPhone}
                </h5>
                <button
                  type="button"
                  onClick={() => handleChange('show_phone', !profile.show_phone)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    profile.show_phone ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      profile.show_phone ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {labels.showPhoneDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export (GDPR / Swiss DSG) */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
        <Heading level={4} className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Datenschutz & Export
        </Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Gemäss Schweizer Datenschutzgesetz (DSG) und EU-DSGVO kannst du jederzeit
          eine Kopie Ihrer Daten anfordern.
        </p>

        {exportError && (
          <div className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{exportError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleExportData}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-purple-600 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800 dark:text-purple-300 dark:hover:bg-purple-900/20"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export wird erstellt...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Meine Daten herunterladen
            </>
          )}
        </button>
      </div>
    </div>
  )
}
